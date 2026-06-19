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
    const pillarId = searchParams.get('pillar_id')

    let query = supabase.from('dimensions').select('*').eq('status', 'active')

    if (indexVersionId) {
      query = query.eq('index_version_id', indexVersionId)
    }

    if (pillarId) {
      query = query.eq('pillar_id', pillarId)
    }

    const { data, error } = await query.order('order_index', { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('[v0] Error fetching dimensions:', error)
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
    const { index_version_id, pillar_id, name, description, weight } = body

    if (!index_version_id || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: index_version_id, name' },
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

    // If pillar_id is provided, verify it exists and belongs to this version
    if (pillar_id) {
      const { data: pillar } = await supabase
        .from('pillars')
        .select('*')
        .eq('id', pillar_id)
        .eq('index_version_id', index_version_id)
        .single()

      if (!pillar) {
        return NextResponse.json(
          { error: 'Pillar not found or unauthorized' },
          { status: 403 }
        )
      }
    }

    // Get max order_index
    const { data: dimensions } = await supabase
      .from('dimensions')
      .select('order_index')
      .eq('index_version_id', index_version_id)
      .order('order_index', { ascending: false })
      .limit(1)

    const maxOrder = dimensions?.[0]?.order_index ?? -1

    const { data, error } = await supabase
      .from('dimensions')
      .insert([
        {
          index_version_id,
          pillar_id: pillar_id || null,
          name,
          description: description || null,
          weight: weight || 1.0,
          status: 'active',
          order_index: maxOrder + 1,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating dimension:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}
