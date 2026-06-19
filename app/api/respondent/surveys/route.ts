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

    const { data, error } = await supabase
      .from('survey_responses')
      .select(
        `
        id,
        status,
        initiated_at,
        submitted_at,
        company_id,
        index_version_id,
        index_versions (
          id,
          name,
          version
        )
      `
      )
      .eq('respondent_id', user.id)
      .order('initiated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[v0] Error fetching surveys:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

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
    const { company_id, index_version_id } = body

    if (!company_id || !index_version_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('survey_responses')
      .insert({
        company_id,
        index_version_id,
        respondent_id: user.id,
        status: 'in_progress',
        initiated_at: new Date().toISOString(),
      })
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (error: any) {
    console.error('[v0] Error creating survey:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
