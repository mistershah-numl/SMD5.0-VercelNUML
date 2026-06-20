'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import Link from 'next/link'
import { PlusCircle, Trash2, Loader2, ArrowRight } from 'lucide-react'
import type { IndexVersion, Company } from '@/lib/types/database'
import dynamic from 'next/dynamic'

function VersionsPageContent() {
  const supabase = createClient()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [versions, setVersions] = useState<IndexVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    version: '1.0',
    description: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Fetch company
      const { data: companies } = await supabase
        .from('companies')
        .select('*')
        .eq('created_by', user.id)
        .single()

      if (companies) {
        setCompany(companies)

        // Fetch versions
        const { data: versionsData } = await supabase
          .from('index_versions')
          .select('*')
          .eq('company_id', companies.id)
          .order('created_at', { ascending: false })

        setVersions(versionsData || [])
      }

      setLoading(false)
    } catch (error) {
      console.error('[v0] Error fetching data:', error)
      setLoading(false)
    }
  }

  const handleCreateVersion = async () => {
    if (!company || !formData.name || !formData.version) return

    try {
      setCreating(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('index_versions')
        .insert([
          {
            company_id: company.id,
            name: formData.name,
            version: formData.version,
            description: formData.description || null,
            created_by: user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setVersions([data, ...versions])
      setShowDialog(false)
      setFormData({ name: '', version: '1.0', description: '' })
    } catch (error) {
      console.error('[v0] Error creating version:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm('Are you sure? This will orphan all pillars and dimensions.')) return

    try {
      setDeleting(versionId)
      const { error } = await supabase.from('index_versions').delete().eq('id', versionId)

      if (error) throw error

      setVersions(versions.filter((v) => v.id !== versionId))
    } catch (error) {
      console.error('[v0] Error deleting version:', error)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading versions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assessment Versions</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage different versions of your assessment framework
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Version
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Assessment Version</DialogTitle>
              <DialogDescription>
                Create a new version of your assessment framework with pillars, dimensions, and questions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-1">Version Name</label>
                <Input
                  placeholder="e.g., SDM5 2024"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Version Number</label>
                <Input
                  placeholder="e.g., 1.0"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  placeholder="Describe this version..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateVersion} disabled={!formData.name || creating} className="w-full">
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Version'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Company Info */}
      {company && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Company: {company.name}</CardTitle>
            {company.description && <CardDescription>{company.description}</CardDescription>}
          </CardHeader>
        </Card>
      )}

      {/* Versions List */}
      {versions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No assessment versions yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first version to start defining pillars, dimensions, and questions.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {versions.map((version) => (
            <Card key={version.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{version.name}</CardTitle>
                    <CardDescription>v{version.version}</CardDescription>
                  </div>
                  <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {new Date(version.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardHeader>
              {version.description && (
                <CardContent className="pb-4">
                  <p className="text-sm text-muted-foreground">{version.description}</p>
                </CardContent>
              )}
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button asChild variant="default" className="gap-2">
                    <Link href={`/admin/versions/${version.id}`}>
                      View & Edit <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteVersion(version.id)}
                    disabled={deleting === version.id}
                  >
                    {deleting === version.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// FIX: Wrap inside dynamic helper setting SSR generation strictly off
const VersionsPage = dynamic(() => Promise.resolve(VersionsPageContent), {
  ssr: false,
})

export default VersionsPage