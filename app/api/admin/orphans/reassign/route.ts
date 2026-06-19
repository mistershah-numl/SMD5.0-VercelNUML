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
    const { items } = body // Array of { id, type, table_name, parent_column, new_parent_id }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid items array' },
        { status: 400 }
      )
    }

    const results = []

    for (const item of items) {
      const { id, table_name, parent_column, new_parent_id } = item

      const { error } = await supabase
        .from(table_name)
        .update({
          status: 'active',
          orphaned_at: null,
          orphaned_reason: null,
          previous_parent_id: null,
          [parent_column]: new_parent_id,
        })
        .eq('id', id)

      if (error) throw error

      results.push({ id, success: true })
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error('[v0] Error reassigning orphaned items:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
