import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { IndexVersion } from '@/lib/types/database'

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
    const companyId = searchParams.get('companyId')

    let query = supabase
      .from('index_versions')
      .select('*')
      .eq('created_by', user.id)

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Error fetching index versions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}

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
    const { company_id, name, version, description } = body

    if (!company_id || !name || !version) {
      return NextResponse.json(
        { error: 'Missing required fields: company_id, name, version' },
        { status: 400 }
      )
    }

    // Verify user owns the company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .eq('created_by', user.id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found or unauthorized' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('index_versions')
      .insert([
        {
          company_id,
          name,
          version,
          description: description || null,
          created_by: user.id,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating index version:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}
