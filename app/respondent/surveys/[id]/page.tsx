'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SurveyTaker } from '@/components/respondent/survey-taker'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function SurveyDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const surveyId = params.id
  const [survey, setSurvey] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetchSurvey()
  }, [surveyId])

  const fetchSurvey = async () => {
    try {
      const res = await fetch(`/api/respondent/surveys/${surveyId}`)
      if (res.ok) {
        const data = await res.json()
        setSurvey(data)
        if (data.status === 'completed') {
          setSubmitted(true)
        }
      }
    } catch (error) {
      console.error('[v0] Error fetching survey:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setSubmitted(true)
      // Refresh survey to show completion confirmation
      await fetchSurvey()
      // Redirect to dashboard after delay to show confirmation
      setTimeout(() => {
        router.push('/respondent')
      }, 4000)
    } catch (error) {
      console.error('[v0] Error in submission:', error)
      setSubmitted(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading survey...</p>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline">
          <Link href="/respondent">
            <ArrowLeft size={18} className="mr-2" />
            Back to Surveys
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 font-semibold">Survey not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted && survey?.status === 'completed') {
    return (
      <div className="space-y-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle size={48} className="text-green-600 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold text-green-800">Assessment Submitted!</h3>
              <p className="text-green-700 mt-2">
                Thank you for completing the {survey.index_versions?.[0]?.name} assessment. 
                Your responses have been saved and are being analyzed.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-4">
              <Button asChild>
                <Link href={`/respondent/surveys/${surveyId}/results`}>
                  View Results
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/respondent">
                  <ArrowLeft size={18} className="mr-2" />
                  Back to Surveys
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/respondent">
          <ArrowLeft size={18} className="mr-2" />
          Back to Surveys
        </Link>
      </Button>

      <SurveyTaker
        surveyId={surveyId}
        surveyData={{
          id: survey.id,
          name: survey.index_versions?.[0]?.name || 'Assessment',
          version: survey.index_versions?.[0]?.version || '1.0',
          pillars: survey.index_versions?.[0]?.pillars || [],
        }}
        previousResponses={survey.responses || []}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
