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
    const dimensionId = searchParams.get('dimension_id')
    const indexVersionId = searchParams.get('index_version_id')

    let query = supabase.from('questions').select('*').eq('status', 'active')

    if (dimensionId) {
      query = query.eq('dimension_id', dimensionId)
    }

    if (indexVersionId) {
      query = query.eq('index_version_id', indexVersionId)
    }

    const { data, error } = await query.order('order_index', { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('[v0] Error fetching questions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
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
      dimension_id,
      index_version_id,
      text,
      question_type,
      weight,
      description,
      question_options,
    } = body

    if (!index_version_id || !text || !question_type) {
      return NextResponse.json(
        { error: 'Missing required fields: index_version_id, text, question_type' },
        { status: 400 }
      )
    }

    // Verify user has access to this version
    const { data: version } = await supabase
      .from('index_versions')
      .select('*')
      .eq('id', index_version_id)
      .eq('created_by', user.id)
      .single()

    if (!version) {
      return NextResponse.json(
        { error: 'Version not found or unauthorized' },
        { status: 403 }
      )
    }

    // If dimension_id is provided, verify it exists and belongs to this version
    if (dimension_id) {
      const { data: dimension } = await supabase
        .from('dimensions')
        .select('*')
        .eq('id', dimension_id)
        .eq('index_version_id', index_version_id)
        .single()

      if (!dimension) {
        return NextResponse.json(
          { error: 'Dimension not found or unauthorized' },
          { status: 403 }
        )
      }
    }

    // Get max order_index
    const { data: questions } = await supabase
      .from('questions')
      .select('order_index')
      .eq('index_version_id', index_version_id)
      .order('order_index', { ascending: false })
      .limit(1)

    const maxOrder = questions?.[0]?.order_index ?? -1

    const { data, error } = await supabase
      .from('questions')
      .insert([
        {
          dimension_id: dimension_id || null,
          index_version_id,
          text,
          question_type,
          weight: weight || 1.0,
          description: description || null,
          status: 'active',
          order_index: maxOrder + 1,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating question:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}
