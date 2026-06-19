import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { item_id, item_type, index_version_id } = body

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

      // Delete all orphaned questions in this dimension first
      const { error: deleteQError } = await supabase
        .from('questions')
        .delete()
        .eq('dimension_id', item_id)
        .eq('status', 'orphaned')

      if (deleteQError) throw deleteQError

      // Delete the dimension
      const { error: deleteDError } = await supabase
        .from('dimensions')
        .delete()
        .eq('id', item_id)

      if (deleteDError) throw deleteDError

      return NextResponse.json({
        success: true,
        message: `Orphaned dimension "${dimension.name}" permanently deleted`,
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

      // Delete the question
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('id', item_id)

      if (deleteError) throw deleteError

      return NextResponse.json({
        success: true,
        message: `Orphaned question permanently deleted`,
      })
    }
  } catch (error) {
    console.error('[v0] Error deleting orphan:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}
