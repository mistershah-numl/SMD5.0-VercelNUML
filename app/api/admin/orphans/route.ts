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

    // Verify user has access to this version
    const { data: version } = await supabase
      .from('index_versions')
      .select('*')
      .eq('id', indexVersionId)
      .eq('created_by', user.id)
      .single()

    if (!version) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get orphaned dimensions
    const { data: dimensions, error: dimsError } = await supabase
      .from('dimensions')
      .select('*')
      .eq('index_version_id', indexVersionId)
      .eq('status', 'orphaned')
      .order('orphaned_at', { ascending: false })

    if (dimsError) throw dimsError

    // Get orphaned questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('index_version_id', indexVersionId)
      .eq('status', 'orphaned')
      .order('orphaned_at', { ascending: false })

    if (questionsError) throw questionsError

    const orphanedCount = (dimensions?.length || 0) + (questions?.length || 0)

    return NextResponse.json({
      orphaned_dimensions: dimensions || [],
      orphaned_questions: questions || [],
      total_orphaned: orphanedCount,
    })
  } catch (error) {
    console.error('[v0] Error fetching orphaned items:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}
