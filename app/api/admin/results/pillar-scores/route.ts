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

    if (!indexVersionId) {
      return NextResponse.json(
        { error: 'index_version_id is required' },
        { status: 400 }
      )
    }

    // Get all assessment results with pillar scores
    const { data: results, error } = await supabase
      .from('assessment_results')
      .select(
        `
        *,
        survey_responses (
          id,
          submitted_at
        )
      `
      )
      .eq('survey_responses.index_version_id', indexVersionId)

    if (error) throw error

    // Extract and aggregate pillar scores
    const pillarScores: Record<string, any> = {}

    results?.forEach((result: any) => {
      if (result.pillar_scores) {
        result.pillar_scores.forEach((pillar: any) => {
          if (!pillarScores[pillar.pillar_id]) {
            pillarScores[pillar.pillar_id] = {
              pillar_id: pillar.pillar_id,
              pillar_name: pillar.pillar_name,
              scores: [],
            }
          }
          pillarScores[pillar.pillar_id].scores.push(pillar.weighted_score)
        })
      }
    })

    // Calculate averages
    const aggregated = Object.values(pillarScores).map((pillar: any) => ({
      ...pillar,
      average_score:
        pillar.scores.length > 0
          ? Math.round((pillar.scores.reduce((a: number, b: number) => a + b, 0) / pillar.scores.length) * 100) / 100
          : 0,
      response_count: pillar.scores.length,
    }))

    return NextResponse.json(aggregated)
  } catch (error: any) {
    console.error('[v0] Error fetching pillar scores:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
