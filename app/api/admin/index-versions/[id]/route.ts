import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getHierarchyStructure } from '@/lib/hierarchy-validator'

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

    const { id } = params
    const searchParams = new URL(request.url).searchParams
    const includeStructure = searchParams.get('structure') === 'true'

    // Get version
    const { data: version, error: versionError } = await supabase
      .from('index_versions')
      .select('*')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (versionError) throw versionError
    if (!version) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (includeStructure) {
      const hierarchy = await getHierarchyStructure(id)
      return NextResponse.json(hierarchy)
    }

    return NextResponse.json(version)
  } catch (error: any) {
    console.error('[v0] Error fetching index version:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
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

    const { id } = params
    const body = await request.json()
    const { name, version, description } = body

    const { data, error } = await supabase
      .from('index_versions')
      .update({
        name,
        version,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('created_by', user.id)
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error: any) {
    console.error('[v0] Error updating index version:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
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

    const { id } = params

    // Fetch all pillars to orphan them
    const { data: pillars, error: pillarsError } = await supabase
      .from('pillars')
      .select('id')
      .eq('index_version_id', id)

    if (pillarsError) throw pillarsError

    // Delete index version (cascades to children)
    const { error: deleteError } = await supabase
      .from('index_versions')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[v0] Error deleting index version:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
