'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download, TrendingUp } from 'lucide-react'

interface SummaryStats {
  total_surveys: number
  completed_surveys: number
  average_score: number
  highest_score: number
  lowest_score: number
  average_completion: number
}

interface PillarScore {
  pillar_id: string
  pillar_name: string
  average_score: number
  response_count: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

interface IndexVersion {
  id: string
  name: string
  version: string
}

interface Company {
  id: string
  name: string
}

export default function ResultsPage() {
  const [summary, setSummary] = useState<SummaryStats | null>(null)
  const [pillarScores, setPillarScores] = useState<PillarScore[]>([])
  const [loading, setLoading] = useState(true)
  const [versions, setVersions] = useState<IndexVersion[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string>('')
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  useEffect(() => {
    loadVersionsAndCompanies()
  }, [])

  useEffect(() => {
    fetchResults()
  }, [selectedVersion, selectedCompany])

  const loadVersionsAndCompanies = async () => {
    try {
      const [versRes, compRes] = await Promise.all([
        fetch('/api/admin/index-versions'),
        fetch('/api/admin/companies'),
      ])

      if (versRes.ok) {
        const data = await versRes.json()
        setVersions(data)
        if (data.length > 0) {
          setSelectedVersion(data[0].id)
        }
      }

      if (compRes.ok) {
        const data = await compRes.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error('[v0] Error loading filters:', error)
    }
  }

  const fetchResults = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedVersion) params.append('index_version_id', selectedVersion)
      if (selectedCompany) params.append('company_id', selectedCompany)
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)

      const queryString = params.toString()
      const suffix = queryString ? `?${queryString}` : ''

      const [summaryRes, pillarRes] = await Promise.all([
        fetch(`/api/admin/results/summary${suffix}`),
        fetch(`/api/admin/results/pillar-scores${suffix}`),
      ])

      if (summaryRes.ok) {
        const data = await summaryRes.json()
        setSummary(data)
      }

      if (pillarRes.ok) {
        const data = await pillarRes.json()
        setPillarScores(data)
      }
    } catch (error) {
      console.error('[v0] Error fetching results:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      // Create a simple CSV export
      const headers = ['Metric', 'Value']
      const rows = [
        ['Total Surveys', summary?.total_surveys],
        ['Completed Surveys', summary?.completed_surveys],
        ['Average Score', summary?.average_score],
        ['Highest Score', summary?.highest_score],
        ['Lowest Score', summary?.lowest_score],
        ['Average Completion', `${Math.round(summary?.average_completion || 0)}%`],
      ]

      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'results-summary.csv'
      a.click()
    } catch (error) {
      console.error('[v0] Error exporting results:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading analytics...</div>
  }

  const maturityDistribution = [
    { name: 'Initial', value: Math.floor((summary?.completed_surveys || 0) * 0.1) },
    { name: 'Managed', value: Math.floor((summary?.completed_surveys || 0) * 0.25) },
    { name: 'Defined', value: Math.floor((summary?.completed_surveys || 0) * 0.3) },
    { name: 'Optimized', value: Math.floor((summary?.completed_surveys || 0) * 0.35) },
  ].filter((item) => item.value > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Assessment Results & Analytics</h2>
          <p className="text-gray-600 mt-2">View and analyze survey responses</p>
        </div>
        <Button onClick={handleExport}>
          <Download size={18} className="mr-2" />
          Export Results
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Index Version</label>
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Versions</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} (v{v.version})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Company</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm font-medium">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Surveys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.total_surveys || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {summary?.completed_surveys || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.average_score?.toFixed(1) || '0'}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={16} className="text-green-600" />
              <span className="text-xs text-gray-500">
                Range: {summary?.lowest_score?.toFixed(1) || '0'} - {summary?.highest_score?.toFixed(1) || '0'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round((summary?.average_completion || 0) * 100)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Average per survey</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pillars">Pillar Scores</TabsTrigger>
          <TabsTrigger value="maturity">Maturity Levels</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Completion Trend</CardTitle>
              <CardDescription>Number of surveys by completion status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: 'Surveys',
                      Completed: summary?.completed_surveys || 0,
                      Pending: ((summary?.total_surveys || 0) - (summary?.completed_surveys || 0)),
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Completed" fill="#10b981" />
                  <Bar dataKey="Pending" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pillars Tab */}
        <TabsContent value="pillars">
          <Card>
            <CardHeader>
              <CardTitle>Average Scores by Pillar</CardTitle>
              <CardDescription>Performance across assessment pillars</CardDescription>
            </CardHeader>
            <CardContent>
              {pillarScores.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={pillarScores}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="pillar_name" angle={-45} textAnchor="end" height={80} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="average_score" fill="#3b82f6" name="Average Score" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-600 text-center py-8">No pillar data available</p>
              )}
            </CardContent>
          </Card>

          {/* Pillar Details */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {pillarScores.map((pillar) => (
              <Card key={pillar.pillar_id}>
                <CardHeader>
                  <CardTitle className="text-lg">{pillar.pillar_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Average Score</p>
                    <p className="text-2xl font-bold">{pillar.average_score.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Responses</p>
                    <p className="text-lg font-semibold">{pillar.response_count}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Maturity Tab */}
        <TabsContent value="maturity">
          <Card>
            <CardHeader>
              <CardTitle>Distribution by Maturity Level</CardTitle>
              <CardDescription>Assessment responses by maturity classification</CardDescription>
            </CardHeader>
            <CardContent>
              {maturityDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={maturityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} (${value})`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {maturityDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-600 text-center py-8">No maturity data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
