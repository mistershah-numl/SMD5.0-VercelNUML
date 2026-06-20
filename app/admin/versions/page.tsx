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
import type { IndexVersion } from '@/lib/types/database'
import dynamic from 'next/dynamic'

function VersionsPageContent() {
  const supabase = createClient()
  const router = useRouter()
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
    fetchVersions()
  }, [])

  const fetchVersions = async () => {
    try {
      const { data: versionsData, error } = await supabase
        .from('index_versions')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && versionsData) {
        setVersions(versionsData)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  const handleCreateVersion = async () => {
    if (!formData.name || !formData.version) return
    try {
      setCreating(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // FIX: Payload body written directly to decoupled table scheme
      const { data, error } = await supabase
        .from('index_versions')
        .insert([
          {
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
      console.error('Error creating version:', error)
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
      console.error('Error deleting version:', error)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assessment Versions</h1>
          <p className="text-muted-foreground mt-1">Create and manage different versions of your assessment framework</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> New Version
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Assessment Version</DialogTitle>
              <DialogDescription>Build custom matrices containing pillars, dimensions, and questions.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-1">Version Name</label>
                <Input
                  placeholder="e.g., SDM5 Sustainable Index 2026"
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
                  placeholder="Describe this structural framework version..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateVersion} disabled={!formData.name || creating} className="w-full">
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Framework Template'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {versions.length === 0 ? (
        <Card className="border-dashed"><CardContent className="pt-6 text-center text-muted-foreground">No assessment templates found.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {versions.map((version) => (
            <Card key={version.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{version.name}</CardTitle>
                    <CardDescription>v{version.version}</CardDescription>
                  </div>
                  <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{new Date(version.created_at).toLocaleDateString()}</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button asChild variant="default"><Link href={`/admin/versions/${version.id}`}>View Structures <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                  <Button variant="destructive" onClick={() => handleDeleteVersion(version.id)} disabled={deleting === version.id}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

const VersionsPage = dynamic(() => Promise.resolve(VersionsPageContent), { ssr: false })
export default VersionsPage;