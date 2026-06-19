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

    const { data, error } = await supabase
      .from('scoring_formulas')
      .select('*')
      .eq('index_version_id', indexVersionId)
      .order('formula_type', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[v0] Error fetching scoring formulas:', error)
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
    const {
      index_version_id,
      name,
      description,
      formula_type,
      operator,
      formula_expression,
      maturity_mapping,
      min_score,
      max_score,
    } = body

    if (!index_version_id || !name || !formula_type || !operator) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('scoring_formulas')
      .insert({
        index_version_id,
        name,
        description,
        formula_type,
        operator,
        formula_expression,
        maturity_mapping,
        min_score: min_score || 0,
        max_score: max_score || 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (error: any) {
    console.error('[v0] Error creating scoring formula:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
