'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

// FIXED: Define explicit Props type mapping Next.js 15 Promise params structure
interface PageProps {
  params: Promise<{ id: string }>
}

export default function SurveyDetailPage({ params }: PageProps) {
  const router = useRouter()
  // Next.js 15 standard safe resolution pattern for asynchronous layout parameters
  const unpackedParams = React.use(params)
  const surveyId = unpackedParams.id

  const supabase = createClient()
  const [surveyResponse, setSurveyResponse] = useState<any>(null)
  const [hierarchy, setHierarchy] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetchSurveyDetails()
  }, [surveyId])

  const fetchSurveyDetails = async () => {
    try {
      setLoading(true)

      // 1. Fetch the master survey container entry instance
      const { data: responseData, error: respError } = await supabase
        .from('survey_responses')
        .select('*, index_versions(name, version)')
        .eq('id', surveyId)
        .maybeSingle()

      if (respError || !responseData) {
        console.error('Survey tracking header not found:', respError)
        setLoading(false)
        return
      }

      setSurveyResponse(responseData)

      // 2. Fetch full structure for the associated version template
      const versionId = responseData.index_version_id

      const [pillarsRes, dimensionsRes, questionsRes, answersRes] = await Promise.all([
        supabase.from('pillars').select('*').eq('index_version_id', versionId).order('order_index', { ascending: true }),
        supabase.from('dimensions').select('*').eq('index_version_id', versionId).order('order_index', { ascending: true }),
        supabase.from('questions').select('*').eq('index_version_id', versionId).order('order_index', { ascending: true }),
        supabase.from('survey_answers').select('*').eq('response_id', surveyId)
      ])

      // 3. Map previously saved responses to state to avoid data loss
      const initialAnswers: Record<string, string> = {}
      answersRes.data?.forEach(ans => {
        initialAnswers[ans.question_id] = ans.answer_value || ''
      })
      setAnswers(initialAnswers)

      // 4. Assemble the diagnostic hierarchy tree array cleanly
      const assembledStructure = (pillarsRes.data || []).map(pillar => {
        const pillarDimensions = (dimensionsRes.data || []).filter(d => d.pillar_id === pillar.id)
        const dimensionsWithQuestions = pillarDimensions.map(dim => ({
          ...dim,
          questions: (questionsRes.data || []).filter(q => q.dimension_id === dim.id)
        }))
        return {
          ...pillar,
          dimensions: dimensionsWithQuestions
        }
      })

      setHierarchy(assembledStructure)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = async (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
    try {
      // Auto-save progress right into the database table row
      await supabase.from('survey_answers').upsert({
        response_id: surveyId,
        question_id: questionId,
        answer_value: value,
        answered_at: new Date().toISOString()
      }, { onConflict: 'response_id,question_id' })
    } catch (err) {
      console.error('Auto-save error:', err)
    }
  }

  const handleSubmitSurvey = async () => {
    try {
      setSubmitting(true)
      
      // Update survey layout instance header status flag
      const { error } = await supabase
        .from('survey_responses')
        .update({ status: 'completed', submitted_at: new Date().toISOString() })
        .eq('id', surveyId)

      if (error) throw error
      setSubmitted(true)
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground">Loading framework questionnaire fields...</div>
  }

  if (!surveyResponse) {
    return (
      <div className="max-w-md mx-auto text-center py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Assessment Not Found</CardTitle>
            <CardDescription>The requested survey index route or parameters could not be located.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full"><Link href="/respondent">Back to Respondent Portal</Link></Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted || surveyResponse.status === 'completed') {
    return (
      <div className="max-w-md mx-auto text-center py-12 px-4">
        <Card className="border-green-200 bg-green-50/20">
          <CardHeader>
            <div className="flex justify-center mb-2"><CheckCircle2 className="h-12 w-12 text-green-600" /></div>
            <CardTitle className="text-green-900">Survey Completed Successfully!</CardTitle>
            <CardDescription>Your Industry 5.0 maturity responses have been logged into the backend scoring matrix.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white"><Link href="/respondent">Return to Dashboard</Link></Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Dynamic Navigation Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/respondent" className="gap-2">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </Button>
        <h2 className="font-bold text-lg text-foreground">{surveyResponse.index_versions?.name}</h2>
      </div>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-8">
        {hierarchy.map((pillar) => (
          <div key={pillar.id} className="space-y-4">
            <h3 className="text-2xl font-bold border-b pb-2 text-primary">{pillar.name}</h3>
            {pillar.description && <p className="text-sm text-muted-foreground">{pillar.description}</p>}

            {pillar.dimensions.map((dim: any) => (
              <div key={dim.id} className="space-y-3 pl-2 border-l-2 border-muted">
                <h4 className="text-lg font-semibold text-foreground">{dim.name}</h4>
                
                {dim.questions.map((q: any) => (
                  <Card key={q.id} className="bg-card">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium">{q.text}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="mt-2">
                        {q.question_type === 'text' ? (
                          <textarea
                            value={answers[q.id] || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            placeholder="Type your metric observation descriptive response..."
                            className="w-full min-h-[80px] p-2 border rounded-md text-sm bg-background"
                          />
                        ) : (
                          // Fallback scale evaluation 1-5 matrix input grid mapping
                          <div className="flex gap-2 flex-wrap">
                            {[1, 2, 3, 4, 5].map((val) => (
                              <Button
                                key={val}
                                size="sm"
                                type="button"
                                variant={answers[q.id] === String(val) ? 'default' : 'outline'}
                                onClick={() => handleAnswerChange(q.id, String(val))}
                                className="w-10 h-10"
                              >
                                {val}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        ))}

        <div className="pt-4 border-t flex justify-end">
          <Button onClick={handleSubmitSurvey} size="lg" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px]">
            {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : 'Submit Assessment'}
          </Button>
        </div>
      </div>
    </div>
  )
}