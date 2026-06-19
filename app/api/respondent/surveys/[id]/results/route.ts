import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Get survey with its responses
    const { data: survey, error: surveyError } = await supabase
      .from('survey_responses')
      .select(
        `
        id,
        status,
        overall_score,
        completed_at,
        index_versions (
          id,
          name,
          version
        ),
        survey_scores (
          id,
          score_type,
          pillar_id,
          dimension_id,
          score,
          pillars (
            id,
            name,
            weight
          ),
          dimensions (
            id,
            name,
            weight
          )
        )
      `
      )
      .eq('id', params.id)
      .eq('respondent_id', userId)
      .single()

    if (surveyError || !survey) {
      return NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      )
    }

    // Get maturity level for overall score
    const { data: maturityLevels } = await supabase
      .from('maturity_levels')
      .select('*')
      .eq('index_version_id', survey.index_versions?.id)
      .order('level', { ascending: true })

    // Find maturity level for overall score
    const overallScore = survey.overall_score || 0
    const maturityLevel = maturityLevels?.find(
      (level) =>
        overallScore >= ((level.score_min || 0)) &&
        overallScore <= ((level.score_max || 100))
    )

    // Organize scores by pillar
    const scoresByPillar = (survey.survey_scores || []).reduce(
      (acc, score) => {
        if (score.score_type === 'pillar') {
          const pillarId = score.pillar_id
          if (!acc[pillarId]) {
            acc[pillarId] = {
              id: pillarId,
              name: score.pillars?.name || 'Unknown Pillar',
              weight: score.pillars?.weight || 1,
              score: score.score,
              dimensions: [],
            }
          }
        } else if (score.score_type === 'dimension') {
          const pillarId = score.pillar_id
          if (!acc[pillarId]) {
            acc[pillarId] = {
              id: pillarId,
              name: 'Unknown Pillar',
              weight: 1,
              score: 0,
              dimensions: [],
            }
          }
          acc[pillarId].dimensions.push({
            id: score.dimension_id,
            name: score.dimensions?.name || 'Unknown Dimension',
            weight: score.dimensions?.weight || 1,
            score: score.score,
          })
        }
        return acc
      },
      {} as Record<
        string,
        {
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
        }
      >
    )

    return NextResponse.json({
      id: survey.id,
      indexVersion: survey.index_versions,
      status: survey.status,
      completedAt: survey.completed_at,
      overallScore,
      maturityLevel: maturityLevel
        ? {
            id: maturityLevel.id,
            level: maturityLevel.level,
            name: maturityLevel.name,
            color: maturityLevel.color,
            description: maturityLevel.description,
          }
        : null,
      pillars: Object.values(scoresByPillar),
    })
  } catch (error) {
    console.error('[v0] Error fetching survey results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
