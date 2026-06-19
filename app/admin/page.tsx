'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { PlusCircle, ArrowRight } from 'lucide-react'
import type { IndexVersion, Company } from '@/lib/types/database'

export default function AdminDashboard() {
  const supabase = createClient()
  const [company, setCompany] = useState<Company | null>(null)
  const [versions, setVersions] = useState<IndexVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        // Fetch user's company
        const { data: companies, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('created_by', user.id)
          .single()

        if (companyError && companyError.code !== 'PGRST116') {
          throw companyError
        }

        if (companies) {
          setCompany(companies)

          // Fetch assessment versions
          const { data: versionsData, error: versionsError } = await supabase
            .from('index_versions')
            .select('*')
            .eq('company_id', companies.id)
            .order('created_at', { ascending: false })

          if (versionsError) throw versionsError
          setVersions(versionsData || [])
        }

        setLoading(false)
      } catch (err) {
        console.error('[v0] Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your assessment framework</p>
        </div>
        <Button asChild>
          <Link href="/admin/versions/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Assessment Version
          </Link>
        </Button>
      </div>

      {/* Company Info */}
      {company ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Company</CardTitle>
            <CardDescription>Assessment framework owner</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold text-lg">{company.name}</p>
              {company.description && <p className="text-sm text-muted-foreground">{company.description}</p>}
              <p className="text-xs text-muted-foreground">Created: {new Date(company.created_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No Company Found</CardTitle>
            <CardDescription>You need to create a company first to start building assessments</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Assessment Versions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Assessment Versions ({versions.length})</h2>
        {versions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  No assessment versions created yet. Create your first assessment version to define pillars, dimensions, and questions.
                </p>
                <Button asChild>
                  <Link href="/admin/versions/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create First Version
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {versions.map((version) => (
              <Card key={version.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{version.name}</CardTitle>
                      <CardDescription>Version {version.version}</CardDescription>
                    </div>
                    <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded">
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
                    <Button variant="default" asChild className="gap-2">
                      <Link href={`/admin/versions/${version.id}`}>
                        View <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/admin/versions/${version.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assessment Versions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{versions.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Surveys</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Follow these steps to set up your assessment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold">Create Assessment Versions</h3>
              <p className="text-sm text-muted-foreground">Create different versions of your assessment framework</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold">Define Pillars & Dimensions</h3>
              <p className="text-sm text-muted-foreground">Organize your assessment structure with pillars and dimensions</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold">Add Questions</h3>
              <p className="text-sm text-muted-foreground">Create survey questions linked to dimensions</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <h3 className="font-semibold">Configure Scoring</h3>
              <p className="text-sm text-muted-foreground">Set up scoring formulas and maturity levels</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
