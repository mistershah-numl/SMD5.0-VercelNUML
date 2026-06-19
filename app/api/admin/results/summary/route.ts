import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const indexVersionId = searchParams.get('index_version_id')
    const companyId = searchParams.get('company_id')

    let query = supabase
      .from('survey_responses')
      .select(
        `
        id,
        status,
        submitted_at,
        company_id,
        respondent_id,
        assessment_results (
          overall_score,
          overall_maturity_level,
          completeness
        )
      `
      )
      .eq('status', 'completed')

    if (indexVersionId) {
      query = query.eq('index_version_id', indexVersionId)
    }

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data: responses, error } = await query

    if (error) throw error

    // Calculate summary statistics
    const results = (responses || []).map((r: any) => r.assessment_results?.[0])
    const scores = results
      .filter((r) => r)
      .map((r) => r.overall_score)

    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0
    const minScore = scores.length > 0 ? Math.min(...scores) : 0

    return NextResponse.json({
      total_surveys: responses?.length || 0,
      completed_surveys: (responses || []).filter((r: any) => r.status === 'completed').length,
      average_score: Math.round(avgScore * 100) / 100,
      highest_score: maxScore,
      lowest_score: minScore,
      average_completion: results.reduce((sum: number, r: any) => sum + (r?.completeness || 0), 0) / (results.length || 1),
    })
  } catch (error: any) {
    console.error('[v0] Error fetching results summary:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
