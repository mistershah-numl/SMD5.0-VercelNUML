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
      .from('maturity_levels')
      .select('*')
      .eq('index_version_id', indexVersionId)
      .order('level', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[v0] Error fetching maturity levels:', error)
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
    const { index_version_id, level, name, description, color } = body

    if (!index_version_id || level === undefined || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('maturity_levels')
      .insert({
        index_version_id,
        level,
        name,
        description,
        color,
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (error: any) {
    console.error('[v0] Error creating maturity level:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
