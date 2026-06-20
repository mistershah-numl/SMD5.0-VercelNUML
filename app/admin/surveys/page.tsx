'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Play, Pause, ClipboardList, Users } from 'lucide-react'
import dynamic from 'next/dynamic'

function AdminSurveysDashboardContent() {
  const supabase = createClient()
  const [versions, setVersions] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [activeSurveys, setActiveSurveys] = useState<any[]>([])
  const [selectedVersion, setSelectedVersion] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorLog, setErrorLog] = useState<string | null>(null)

  useEffect(() => {
    loadSurveyDashboardData()
  }, [])

  const loadSurveyDashboardData = async () => {
    try {
      setLoading(true)
      setErrorLog(null)
      
      const { data: vData } = await supabase.from('index_versions').select('*')
      setVersions(vData || [])
      if (vData && vData.length > 0) setSelectedVersion(vData[0].id)

      const { data: cData } = await supabase.from('companies').select('*')
      setCompanies(cData || [])
      if (cData && cData.length > 0) setSelectedCompany(cData[0].id)

      const { data: sData } = await supabase
        .from('survey_responses')
        .select(`
          id,
          status,
          initiated_at,
          index_versions (name, version),
          companies (name)
        `)
      setActiveSurveys(sData || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDeploySurvey = async () => {
    if (!selectedVersion || !selectedCompany) {
      setErrorLog('Please select both an index version and a target company.')
      return
    }
    try {
      setErrorLog(null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Matches 'initiated' status to satisfy your database check constraints perfectly
      const { error } = await supabase.from('survey_responses').insert({
        index_version_id: selectedVersion,
        company_id: selectedCompany,
        respondent_id: user.id,
        status: 'initiated',
        initiated_at: new Date().toISOString()
      })

      if (error) throw error
      loadSurveyDashboardData()
    } catch (e: any) {
      console.error('Deployment execution failed:', e)
      setErrorLog(e?.message || JSON.stringify(e))
    }
  }

  const handleToggleStatus = async (surveyId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'initiated' ? 'completed' : 'initiated'
    await supabase.from('survey_responses').update({ status: nextStatus }).eq('id', surveyId)
    loadSurveyDashboardData()
  }

  const chartData = activeSurveys.map(s => ({
    name: s.companies?.name || 'Assigned Participant',
    Progress: s.status === 'completed' ? 100 : 25
  }))

  if (loading) {
    return <div className="p-12 text-center">Loading survey matrices...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Survey Management Center</h1>
        <p className="text-muted-foreground mt-1">Deploy index configurations, toggle active states, and track progress.</p>
      </div>

      {errorLog && (
        <Card className="border-red-200 bg-red-50 text-red-800 p-4 font-mono text-xs">
          <strong>Database Exception:</strong> {errorLog}
        </Card>
      )}

      <Tabs defaultValue="control" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="control"><ClipboardList className="w-4 h-4 mr-2" /> Deploy & Control</TabsTrigger>
          <TabsTrigger value="analytics"><Users className="w-4 h-4 mr-2" /> Progress Benchmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="control" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deploy New Assessment Survey</CardTitle>
              <CardDescription>Publish an index framework and assign it to an onboarding company.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                <label className="text-sm font-medium">Framework Version</label>
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="px-3 py-2 border rounded-lg bg-background w-full"
                >
                  {versions.map(v => (
                    <option key={v.id} value={v.id}>{v.name} (v{v.version})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                <label className="text-sm font-medium">Target Company</label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="px-3 py-2 border rounded-lg bg-background w-full"
                >
                  <option value="">-- Select Recipient Company --</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.status})</option>
                  ))}
                </select>
              </div>

              <Button onClick={handleDeploySurvey} className="bg-blue-600 hover:bg-blue-700 text-white h-10">
                Deploy Active Survey
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <h3 className="text-xl font-bold mt-4">Active Deployments</h3>
            {activeSurveys.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active assessment deployments found.</p>
            ) : (
              activeSurveys.map((survey) => (
                <Card key={survey.id} className="p-4 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h4 className="font-semibold text-lg">{survey.index_versions?.name || 'SDM5 Framework'}</h4>
                    <p className="text-sm text-muted-foreground">
                      Company: <span className="font-medium text-foreground">{survey.companies?.name || 'Global Template'}</span> • Status: <span className="capitalize font-medium">{survey.status}</span>
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant={survey.status === 'initiated' ? 'outline' : 'default'}
                    onClick={() => handleToggleStatus(survey.id, survey.status)}
                    className="gap-2"
                  >
                    {survey.status === 'initiated' ? <Pause size={14} className="text-amber-600" /> : <Play size={14} className="text-green-600" />}
                    {survey.status === 'initiated' ? 'Pause Survey' : 'Activate Survey'}
                  </Button>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Survey Completion Rates</CardTitle></CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No participation metrics data found.</p>
              ) : (
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="Progress" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const AdminSurveysDashboard = dynamic(() => Promise.resolve(AdminSurveysDashboardContent), { ssr: false })
export default AdminSurveysDashboard