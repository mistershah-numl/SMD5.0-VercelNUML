import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { survey_response_id, question_id, value, text_response } = body

    if (!survey_response_id || !question_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if response already exists
    const { data: existing } = await supabase
      .from('question_responses')
      .select('id')
      .eq('survey_response_id', survey_response_id)
      .eq('question_id', question_id)
      .single()

    if (existing) {
      // Update existing response
      const { data, error } = await supabase
        .from('question_responses')
        .update({
          value: value ?? null,
          text_response: text_response ?? null,
          responded_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()

      if (error) throw error
      return NextResponse.json(data[0])
    }

    // Create new response
    const { data, error } = await supabase
      .from('question_responses')
      .insert({
        survey_response_id,
        question_id,
        value: value ?? null,
        text_response: text_response ?? null,
        responded_at: new Date().toISOString(),
      })
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (error: any) {
    console.error('[v0] Error saving question response:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
