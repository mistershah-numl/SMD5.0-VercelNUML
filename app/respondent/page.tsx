'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LogOut, Building2, ArrowRight } from 'lucide-react'
import dynamic from 'next/dynamic'

function RespondentDashboardContent() {
  const router = useRouter()
  const [surveys, setSurveys] = useState<any[]>([])
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  
  // Registration form state
  const [companyName, setCompanyName] = useState('')
  const [companyDesc, setCompanyDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchWorkspaceContext()
  }, [])

  const fetchWorkspaceContext = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        window.location.href = '/auth/login'
        return
      }

      setUserEmail(user.email || '')

      // 1. Fetch the logged-in user's company profile row
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('created_by', user.id)
        .maybeSingle()

      if (companyData) {
        setCompany(companyData)

        // 2. FIXED: If the company is approved, find all surveys assigned to their company ID
        if (companyData.status === 'approved') {
          const { data: surveyData, error: surveyErr } = await supabase
            .from('survey_responses')
            .select(`
              id, 
              status, 
              initiated_at, 
              submitted_at, 
              index_versions (name, version, id)
            `)
            .eq('company_id', companyData.id) // Query based on company assignment parameter

          if (surveyErr) console.error('Survey fetch error:', surveyErr)
          setSurveys(surveyData || [])
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName) return
    try {
      setSubmitting(true)
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          description: companyDesc,
          created_by: user.id,
          status: 'pending'
        })

      if (error) throw error
      fetchWorkspaceContext()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      setLoading(true)
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      await supabase.auth.signOut({ scope: 'global' })
      localStorage.clear()
      sessionStorage.clear()
      
      window.location.href = '/auth/login'
    } catch (err) {
      console.error('Logout failed:', err)
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground">Verifying organizational dashboard state...</div>
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold text-foreground">SDM5 Respondent Portal</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded border">{userEmail}</span>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/10">
            <LogOut size={16} /> Logout
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
        {!company ? (
          <Card>
            <CardHeader>
              <CardTitle>Setup Your Organization Profile</CardTitle>
              <CardDescription>Register your company to request access keys from the platform administrator.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegisterCompany} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Company Name</label>
                  <Input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g., Global Industry Dynamics" />
                </div>
                <div>
                  <label className="text-sm font-medium">Description / Operations Sector</label>
                  <Textarea value={companyDesc} onChange={(e) => setCompanyDescription(e.target.value)} placeholder="Describe core business framework..." />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white">Register Company</Button>
              </form>
            </CardContent>
          </Card>
        ) : company.status === 'pending' ? (
          <Card className="border-amber-200 bg-amber-50/40 text-center py-8">
            <CardHeader>
              <CardTitle className="text-amber-800 flex items-center justify-center gap-2">
                <Building2 className="h-6 w-6" /> Registration Awaiting Approval
              </CardTitle>
              <CardDescription>Your profile for <strong>{company.name}</strong> is currently pending evaluation.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-700">Please switch back to your Admin account to approve this registration request. Once approved, deployed index surveys will instantly show up here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">My Active Digital Maturity Assessments</h2>
            <p className="text-muted-foreground text-sm">Select an active survey to fill out your responses and check your sustainability score matrix.</p>
            
            {surveys.length === 0 ? (
              <Card className="border-dashed"><CardContent className="py-8 text-center text-muted-foreground">No active surveys have been deployed to your organization code yet by the administrator.</CardContent></Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {surveys.map((survey) => (
                  <Card key={survey.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{survey.index_versions?.name || 'Industry Framework'}</CardTitle>
                      <CardDescription>Version Matrix Configuration: v{survey.index_versions?.version || '1.0'}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="mb-4 text-xs text-muted-foreground">
                        Status: <span className="capitalize font-semibold text-foreground">{survey.status}</span>
                      </div>
                      <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2">
                        <Link href={`/respondent/surveys/${survey.id}`}>
                          {survey.status === 'completed' ? 'View Results Breakdown' : 'Start Assessment'}
                          <ArrowRight size={16} />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Disable SSR compilation execution steps
const RespondentDashboard = dynamic(() => Promise.resolve(RespondentDashboardContent), { ssr: false })
export default RespondentDashboard