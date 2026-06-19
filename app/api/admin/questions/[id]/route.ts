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
      .from('questions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Error fetching question:', error)
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
    const { text, question_type, weight, description } = body

    // Verify user has access through version
    const { data: question } = await supabase
      .from('questions')
      .select('index_version_id')
      .eq('id', params.id)
      .single()

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const { data: version } = await supabase
      .from('index_versions')
      .select('*')
      .eq('id', question.index_version_id)
      .eq('created_by', user.id)
      .single()

    if (!version) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('questions')
      .update({
        text: text || undefined,
        question_type: question_type || undefined,
        weight: weight || undefined,
        description: description !== undefined ? description : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Error updating question:', error)
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

    // Get question details
    const { data: question, error: qError } = await supabase
      .from('questions')
      .select('index_version_id, text')
      .eq('id', params.id)
      .single()

    if (qError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Verify user has access
    const { data: version } = await supabase
      .from('index_versions')
      .select('*')
      .eq('id', question.index_version_id)
      .eq('created_by', user.id)
      .single()

    if (!version) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the question
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('id', params.id)

    if (deleteError) throw deleteError

    return NextResponse.json({
      success: true,
      message: `Question "${question.text}" deleted.`,
    })
  } catch (error) {
    console.error('[v0] Error deleting question:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}
