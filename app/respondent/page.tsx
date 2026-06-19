'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function RespondentDashboard() {
  const supabase = createClient()
  const [surveys, setSurveys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        // Fetch surveys available for this user
        const { data, error } = await supabase
          .from('survey_responses')
          .select(
            `
            id,
            status,
            initiated_at,
            submitted_at,
            index_versions (
              name,
              version,
              id
            )
          `
          )
          .eq('respondent_id', user.id)
          .order('initiated_at', { ascending: false })

        if (error) throw error

        setSurveys(data || [])
      } catch (error) {
        console.error('[v0] Error fetching surveys:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSurveys()
  }, [supabase])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Surveys</h1>
        <p className="text-gray-600 mt-2">
          Take or resume your sustainability assessments
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading surveys...</p>
        </div>
      ) : surveys.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">No surveys available yet.</p>
            <p className="text-sm text-gray-500 mt-2">
              Check back later or contact your administrator.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {surveys.map((survey) => (
            <Card key={survey.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {survey.index_versions?.[0]?.name}
                    </CardTitle>
                    <CardDescription>
                      v{survey.index_versions?.[0]?.version}
                    </CardDescription>
                  </div>
                  <span className={`px-2.5 py-1.5 rounded-full text-xs font-semibold ${
                    survey.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {survey.status === 'completed' ? '✓ Done' : 'In Progress'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Started: {new Date(survey.initiated_at).toLocaleDateString()}</p>
                  {survey.submitted_at && (
                    <p>Completed: {new Date(survey.submitted_at).toLocaleDateString()}</p>
                  )}
                </div>
                <Button asChild className="w-full">
                  <Link href={`/respondent/surveys/${survey.id}`}>
                    {survey.status === 'completed' ? 'View Survey' : 'Continue Survey'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
