import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table_name')
    const { id } = params

    if (!tableName) {
      return NextResponse.json(
        { error: 'table_name is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[v0] Error deleting orphaned item:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
