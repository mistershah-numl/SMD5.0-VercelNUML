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
      .from('pillars')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Pillar not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Error fetching pillar:', error)
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
    const { data: pillar } = await supabase
      .from('pillars')
      .select('index_version_id')
      .eq('id', params.id)
      .single()

    if (!pillar) {
      return NextResponse.json({ error: 'Pillar not found' }, { status: 404 })
    }

    const { data: version } = await supabase
      .from('index_versions')
      .select('*')
      .eq('id', pillar.index_version_id)
      .eq('created_by', user.id)
      .single()

    if (!version) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('pillars')
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
    console.error('[v0] Error updating pillar:', error)
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

    // Get pillar details
    const { data: pillar, error: pillarError } = await supabase
      .from('pillars')
      .select('index_version_id, name')
      .eq('id', params.id)
      .single()

    if (pillarError || !pillar) {
      return NextResponse.json({ error: 'Pillar not found' }, { status: 404 })
    }

    // Verify user has access
    const { data: version } = await supabase
      .from('index_versions')
      .select('*')
      .eq('id', pillar.index_version_id)
      .eq('created_by', user.id)
      .single()

    if (!version) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Mark all dimensions as orphaned
    const { error: updateError } = await supabase
      .from('dimensions')
      .update({
        status: 'orphaned',
        orphaned_at: new Date().toISOString(),
        orphaned_reason: 'pillar_deleted',
        previous_parent_id: params.id,
        pillar_id: null,
      })
      .eq('pillar_id', params.id)

    if (updateError) throw updateError

    // Delete pillar
    const { error: deleteError } = await supabase
      .from('pillars')
      .delete()
      .eq('id', params.id)

    if (deleteError) throw deleteError

    return NextResponse.json({
      success: true,
      message: `Pillar "${pillar.name}" deleted. Child dimensions are now orphaned.`,
    })
  } catch (error) {
    console.error('[v0] Error deleting pillar:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}
