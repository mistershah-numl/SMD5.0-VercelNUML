'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { PlusCircle, ArrowRight, CheckCircle, XCircle, Building2 } from 'lucide-react'
import type { IndexVersion, Company } from '@/lib/types/database'

export default function AdminDashboard() {
  const supabase = createClient()
  const [versions, setVersions] = useState<IndexVersion[]>([])
  const [pendingCompanies, setPendingCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // 1. Fetch Global or Admin Assessment Versions
      const { data: versionsData, error: versionsError } = await supabase
        .from('index_versions')
        .select('*')
        .order('created_at', { ascending: false })

      if (versionsError) throw versionsError
      setVersions(versionsData || [])

      // 2. Fetch Companies awaiting Administrator Approval
      const { data: companiesData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('status', 'pending')

      if (!companyError && companiesData) {
        setPendingCompanies(companiesData)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const handleCompanyAction = async (companyId: string, action: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ status: action, updated_at: new Date().toISOString() })
        .eq('id', companyId)

      if (error) throw error
      
      // Update local state instantly
      setPendingCompanies(pendingCompanies.filter(c => c.id !== companyId))
    } catch (err) {
      console.error(`Failed to execute ${action} on company:`, err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading platform panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Workspace Console</h1>
          <p className="text-muted-foreground mt-1">Configure frameworks, formulas, and approve company access keys</p>
        </div>
        <Button asChild>
          <Link href="/admin/versions">
            <PlusCircle className="mr-2 h-4 w-4" />
            Manage Assessment Frameworks
          </Link>
        </Button>
      </div>

      {/* Company Approval Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Company Registration Pipeline ({pendingCompanies.length})
          </CardTitle>
          <CardDescription>Approve or Reject organization requests to unlock survey paths</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingCompanies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending organization approvals at this time.</p>
          ) : (
            <div className="divide-y divide-border border rounded-md bg-background">
              {pendingCompanies.map((comp) => (
                <div key={comp.id} className="p-4 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="font-semibold text-sm">{comp.name}</p>
                    <p className="text-xs text-muted-foreground">{comp.description || 'No description provided.'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 gap-1 text-white"
                      onClick={() => handleCompanyAction(comp.id, 'approved')}
                    >
                      <CheckCircle size={14} /> Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="gap-1"
                      onClick={() => handleCompanyAction(comp.id, 'rejected')}
                    >
                      <XCircle size={14} /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assessment Framework Matrices Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Global Master Frameworks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{versions.length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}