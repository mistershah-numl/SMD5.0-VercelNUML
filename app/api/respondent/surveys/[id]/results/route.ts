import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Force Next.js to skip static generation and treat this purely as a runtime endpoint
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Move Environment validation safely inside runtime execution context
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // If running build locally without a production .env, bypass cleanly
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { data: [], message: 'Safely bypassed static collection during build.' },
        { status: 200 }
      )
    }

    // 2. Initialize client safely inside execution thread scope
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Await params asynchronously to comply with Next.js 15 requirements
    const params = await context.params
    const surveyId = params?.id

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // 3. Query survey metrics with nested relations mapping layout
    const { data: survey, error: surveyError } = await supabase
      .from('survey_responses')
      .select(`
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
      `)
      .eq('id', surveyId)
      .eq('respondent_id', userId)
      .single()

    if (surveyError || !survey) {
      return NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      )
    }

    // 4. Retrieve framework alignment rules
    const { data: maturityLevels } = await supabase
      .from('maturity_levels')
      .select('*')
      .eq('index_version_id', (survey.index_versions as any)?.id)
      .order('level', { ascending: true })

    const overallScore = survey.overall_score || 0
    const maturityLevel = maturityLevels?.find(
      (level) =>
        overallScore >= (level.score_min || 0) &&
        overallScore <= (level.score_max || 100)
    )

    // 5. Formulate layout structure reduction schema map
    const scoresByPillar = (survey.survey_scores || []).reduce(
      (acc, score: any) => {
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
          } else {
            // Fill missing values if item was created by fallback rows
            acc[pillarId].name = score.pillars?.name || acc[pillarId].name
            acc[pillarId].weight = score.pillars?.weight || acc[pillarId].weight
            acc[pillarId].score = score.score
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