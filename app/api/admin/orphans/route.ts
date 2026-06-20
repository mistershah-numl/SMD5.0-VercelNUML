import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const indexVersionId = searchParams.get('index_version_id')

    // Formulate global base structural queries
    let dimQuery = supabase.from('dimensions').select('*').eq('status', 'orphaned')
    let qQuery = supabase.from('questions').select('*').eq('status', 'orphaned')

    // Apply optional framework version filters if explicitly provided
    if (indexVersionId) {
      dimQuery = dimQuery.eq('index_version_id', indexVersionId)
      qQuery = qQuery.eq('index_version_id', indexVersionId)
    }

    const [dimsRes, qsRes] = await Promise.all([
      dimQuery.order('orphaned_at', { ascending: false }),
      qQuery.order('orphaned_at', { ascending: false })
    ])

    if (dimsRes.error) throw dimsRes.error
    if (qsRes.error) throw qsRes.error

    const dimensions = dimsRes.data || []
    const questions = qsRes.data || []
    const totalOrphaned = dimensions.length + questions.length

    // Match array keys to what your UI page expects exactly
    return NextResponse.json({
      pillars: [], // Pillars don't have a parent to drop from
      dimensions: dimensions,
      questions: questions,
      total_orphaned: totalOrphaned
    })
  } catch (error) {
    console.error('[v0] Error fetching orphaned items:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}