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

    const { data, error } = await supabase
      .from('dimensions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Dimension not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Error fetching dimension:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    const body = await request.json()
    const { name, description, weight } = body

    // Verify user has access through version
    const { data: dimension } = await supabase
      .from('dimensions')
      .select('index_version_id')
      .eq('id', params.id)
      .single()

    if (!dimension) {
      return NextResponse.json(
        { error: 'Dimension not found' },
        { status: 404 }
      )
    }

    const { data: version } = await supabase
      .from('index_versions')
      .select('*')
      .eq('id', dimension.index_version_id)
      .eq('created_by', user.id)
      .single()

    if (!version) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('dimensions')
      .update({
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        weight: weight || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Error updating dimension:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Get dimension details
    const { data: dimension, error: dimError } = await supabase
      .from('dimensions')
      .select('index_version_id, name')
      .eq('id', params.id)
      .single()

    if (dimError || !dimension) {
      return NextResponse.json(
        { error: 'Dimension not found' },
        { status: 404 }
      )
    }

    // Verify user has access
    const { data: version } = await supabase
      .from('index_versions')
      .select('*')
      .eq('id', dimension.index_version_id)
      .eq('created_by', user.id)
      .single()

    if (!version) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Mark all questions as orphaned
    const { error: updateError } = await supabase
      .from('questions')
      .update({
        status: 'orphaned',
        orphaned_at: new Date().toISOString(),
        orphaned_reason: 'dimension_deleted',
        previous_parent_id: params.id,
        dimension_id: null,
      })
      .eq('dimension_id', params.id)

    if (updateError) throw updateError

    // Delete dimension
    const { error: deleteError } = await supabase
      .from('dimensions')
      .delete()
      .eq('id', params.id)

    if (deleteError) throw deleteError

    return NextResponse.json({
      success: true,
      message: `Dimension "${dimension.name}" deleted. Child questions are now orphaned.`,
    })
  } catch (error) {
    console.error('[v0] Error deleting dimension:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}
