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
    const { item_id, item_type, new_parent_id, index_version_id } = body

    if (!item_id || !item_type || !index_version_id) {
      return NextResponse.json(
        { error: 'Missing required fields: item_id, item_type, index_version_id' },
        { status: 400 }
      )
    }

    if (!['dimension', 'question'].includes(item_type)) {
      return NextResponse.json(
        { error: 'Invalid item_type. Must be "dimension" or "question"' },
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (item_type === 'dimension') {
      // Verify the dimension exists and is orphaned
      const { data: dimension } = await supabase
        .from('dimensions')
        .select('*')
        .eq('id', item_id)
        .eq('status', 'orphaned')
        .single()

      if (!dimension) {
        return NextResponse.json(
          { error: 'Dimension not found or not orphaned' },
          { status: 404 }
        )
      }

      // If new_parent_id is provided, verify it's a valid pillar
      if (new_parent_id) {
        const { data: pillar } = await supabase
          .from('pillars')
          .select('*')
          .eq('id', new_parent_id)
          .eq('index_version_id', index_version_id)
          .single()

        if (!pillar) {
          return NextResponse.json(
            { error: 'Parent pillar not found' },
            { status: 404 }
          )
        }
      }

      // Recover the dimension
      const { data, error } = await supabase
        .from('dimensions')
        .update({
          pillar_id: new_parent_id || null,
          status: 'active',
          orphaned_at: null,
          orphaned_reason: null,
          previous_parent_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item_id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: `Dimension "${dimension.name}" recovered successfully`,
        item: data,
      })
    }

    if (item_type === 'question') {
      // Verify the question exists and is orphaned
      const { data: question } = await supabase
        .from('questions')
        .select('*')
        .eq('id', item_id)
        .eq('status', 'orphaned')
        .single()

      if (!question) {
        return NextResponse.json(
          { error: 'Question not found or not orphaned' },
          { status: 404 }
        )
      }

      // If new_parent_id is provided, verify it's a valid dimension
      if (new_parent_id) {
        const { data: dimension } = await supabase
          .from('dimensions')
          .select('*')
          .eq('id', new_parent_id)
          .eq('index_version_id', index_version_id)
          .single()

        if (!dimension) {
          return NextResponse.json(
            { error: 'Parent dimension not found' },
            { status: 404 }
          )
        }
      }

      // Recover the question
      const { data, error } = await supabase
        .from('questions')
        .update({
          dimension_id: new_parent_id || null,
          status: 'active',
          orphaned_at: null,
          orphaned_reason: null,
          previous_parent_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item_id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: `Question "${question.text}" recovered successfully`,
        item: data,
      })
    }
  } catch (error) {
    console.error('[v0] Error recovering orphan:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}
