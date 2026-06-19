import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const { data: survey, error: surveyError } = await supabase
      .from('survey_responses')
      .select(
        `
        *,
        index_versions (
          id,
          name,
          version,
          pillars (
            id,
            name,
            weight,
            dimensions (
              id,
              name,
              weight,
              questions (
                id,
                text,
                question_type,
                description,
                question_options (
                  id,
                  text,
                  value
                )
              )
            )
          )
        )
      `
      )
      .eq('id', id)
      .eq('respondent_id', user.id)
      .single()

    if (surveyError) throw surveyError

    if (!survey) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Get all question responses
    const { data: responses, error: responsesError } = await supabase
      .from('question_responses')
      .select('*')
      .eq('survey_response_id', id)

    if (responsesError) throw responsesError

    return NextResponse.json({
      ...survey,
      responses: responses || [],
    })
  } catch (error: any) {
    console.error('[v0] Error fetching survey:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { status } = body

    const { data, error } = await supabase
      .from('survey_responses')
      .update({
        status,
        submitted_at: status === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .eq('respondent_id', user.id)
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error: any) {
    console.error('[v0] Error updating survey:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
