'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MaturityBadge } from '@/components/results/maturity-badge'
import { ScoreCard } from '@/components/results/score-card'
import { PillarBreakdown } from '@/components/results/pillar-breakdown'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ResultsData {
  id: string
  indexVersion: {
    id: string
    name: string
    version: string
  }
  status: string
  completedAt: string
  overallScore: number
  maturityLevel: {
    id: string
    level: number
    name: string
    color: string
    description: string
  } | null
  pillars: Array<{
    id: string
    name: string
    weight: number
    score: number
    dimensions: Array<{
      id: string
      name: string
      weight: number
      score: number
    }>
  }>
}

export default function SurveyResultsPage() {
  const params = useParams()
  const router = useRouter()
  const surveyId = params.id as string

  const [results, setResults] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchResults()
  }, [surveyId])

  const fetchResults = async () => {
    try {
      setLoading(true)
      setError('')

      const res = await fetch(
        `/api/respondent/surveys/${surveyId}/results?userId=${await getUserId()}`
      )

      if (!res.ok) {
        if (res.status === 404) {
          setError('Survey results not found')
        } else {
          setError('Failed to load results')
        }
        return
      }

      const data = await res.json()
      setResults(data)
    } catch (err) {
      console.error('[v0] Error fetching results:', err)
      setError('Error loading results')
    } finally {
      setLoading(false)
    }
  }

  const getUserId = async (): Promise<string> => {
    // This would normally come from auth context
    // For now, we'll fetch it from the session
    const res = await fetch('/api/auth/session')
    if (res.ok) {
      const data = await res.json()
      return data.user?.id || ''
    }
    return ''
  }

  const handleDownloadReport = async () => {
    if (!results) return

    try {
      // Create a simple text report
      let report = `Survey Results Report\n`
      report += `${'='.repeat(50)}\n\n`
      report += `Survey: ${results.indexVersion.name} (v${results.indexVersion.version})\n`
      report += `Completed: ${new Date(results.completedAt).toLocaleDateString()}\n\n`

      report += `Overall Score: ${results.overallScore.toFixed(1)}/100\n`
      if (results.maturityLevel) {
        report += `Maturity Level: Level ${results.maturityLevel.level} - ${results.maturityLevel.name}\n`
      }
      report += `\n${'='.repeat(50)}\n`

      report += `Pillar Scores\n${'='.repeat(50)}\n\n`
      results.pillars.forEach((pillar) => {
        report += `${pillar.name}\n`
        report += `Score: ${pillar.score.toFixed(1)}/100\n`
        report += `Weight: ${(pillar.weight * 100).toFixed(0)}%\n`

        if (pillar.dimensions.length > 0) {
          report += `Dimensions:\n`
          pillar.dimensions.forEach((dimension) => {
            report += `  - ${dimension.name}: ${dimension.score.toFixed(1)}/100\n`
          })
        }
        report += '\n'
      })

      // Download as text file
      const blob = new Blob([report], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `survey-results-${new Date().toISOString().split('T')[0]}.txt`
      a.click()
    } catch (error) {
      console.error('[v0] Error downloading report:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin mr-2" />
        <span>Loading results...</span>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline">
          <Link href="/respondent">
            <ArrowLeft size={18} className="mr-2" />
            Back to Surveys
          </Link>
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error || 'Failed to load survey results'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const overallPercentage = (results.overallScore / 100) * 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button asChild variant="outline" className="mb-4">
            <Link href="/respondent">
              <ArrowLeft size={18} className="mr-2" />
              Back to Surveys
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Survey Results</h1>
          <p className="text-gray-600 mt-2">{results.indexVersion.name}</p>
        </div>
        <Button onClick={handleDownloadReport}>
          <Download size={18} className="mr-2" />
          Download Report
        </Button>
      </div>

      {/* Overall Score Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Your Assessment Score</CardTitle>
          <CardDescription>Completed on {new Date(results.completedAt).toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-5xl font-bold text-center">
                {results.overallScore.toFixed(1)}
                <span className="text-2xl text-gray-500 ml-2">/100</span>
              </div>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                />
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">
                {overallPercentage.toFixed(0)}% Complete
              </p>
            </div>

            {results.maturityLevel && (
              <div className="flex items-center justify-center">
                <MaturityBadge
                  level={results.maturityLevel.level}
                  name={results.maturityLevel.name}
                  color={results.maturityLevel.color}
                  size="lg"
                />
              </div>
            )}
          </div>

          {results.maturityLevel && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What This Means</h3>
              <p className="text-sm text-gray-700">{results.maturityLevel.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pillar Breakdown */}
      <PillarBreakdown pillars={results.pillars} maxScore={100} />

      {/* Summary Info */}
      <Card>
        <CardHeader>
          <CardTitle>About Your Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>
            Your assessment results have been calculated based on your responses to all questions across
            each pillar and dimension. The scores reflect your organization&apos;s maturity level in{' '}
            {results.indexVersion.name}.
          </p>
          <p>
            Each pillar score is weighted based on its importance in the overall assessment. Dimension
            scores contribute to their parent pillar, which then contribute to your overall score.
          </p>
          <p>
            Your maturity level classification indicates your current state relative to the assessment
            framework. Use these results to identify areas for improvement and track progress over time.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
