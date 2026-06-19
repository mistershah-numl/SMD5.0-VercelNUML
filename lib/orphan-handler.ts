import { createClient } from '@/lib/supabase/server'

export type OrphanType = 'pillar' | 'dimension' | 'question'
export type OrphanReason = 'pillar_deleted' | 'dimension_deleted' | 'version_deleted' | 'manual'

export interface OrphanedItem {
  id: string
  type: OrphanType
  name: string
  orphaned_reason: OrphanReason
  orphaned_at: string
  previous_parent_id?: string
}

export async function markAsOrphaned(
  tableName: string,
  itemId: string,
  reason: OrphanReason,
  previousParentId?: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(tableName)
    .update({
      status: 'orphaned',
      orphaned_at: new Date().toISOString(),
      orphaned_reason: reason,
      previous_parent_id: previousParentId,
    })
    .eq('id', itemId)
    .select()

  if (error) throw error
  return data
}

export async function orphanChildren(
  childTableName: string,
  parentTableName: string,
  parentIdColumn: string,
  parentId: string,
  reason: OrphanReason
) {
  const supabase = await createClient()

  // Get all children first
  const { data: children, error: fetchError } = await supabase
    .from(childTableName)
    .select('id')
    .eq(parentIdColumn, parentId)

  if (fetchError) throw fetchError

  // Mark all as orphaned
  if (children && children.length > 0) {
    const { error: updateError } = await supabase
      .from(childTableName)
      .update({
        status: 'orphaned',
        orphaned_at: new Date().toISOString(),
        orphaned_reason: reason,
        previous_parent_id: parentId,
        [parentIdColumn]: null,
      })
      .in('id', children.map((c: any) => c.id))

    if (updateError) throw updateError
  }

  return children
}

export async function getOrphanedItems(
  indexVersionId?: string,
  reason?: OrphanReason
) {
  const supabase = await createClient()

  let query = supabase
    .from('pillars')
    .select('*')
    .eq('status', 'orphaned')

  if (indexVersionId) {
    query = query.eq('index_version_id', indexVersionId)
  }

  if (reason) {
    query = query.eq('orphaned_reason', reason)
  }

  const { data: orphanedPillars, error: pillarsError } = await query

  if (pillarsError) throw pillarsError

  // Get orphaned dimensions
  let dimQuery = supabase
    .from('dimensions')
    .select('*')
    .eq('status', 'orphaned')

  if (indexVersionId) {
    dimQuery = dimQuery.eq('index_version_id', indexVersionId)
  }

  if (reason) {
    dimQuery = dimQuery.eq('orphaned_reason', reason)
  }

  const { data: orphanedDimensions, error: dimensionsError } = await dimQuery

  if (dimensionsError) throw dimensionsError

  // Get orphaned questions
  let qQuery = supabase
    .from('questions')
    .select('*')
    .eq('status', 'orphaned')

  if (indexVersionId) {
    qQuery = qQuery.eq('index_version_id', indexVersionId)
  }

  if (reason) {
    qQuery = qQuery.eq('orphaned_reason', reason)
  }

  const { data: orphanedQuestions, error: questionsError } = await qQuery

  if (questionsError) throw questionsError

  return {
    pillars: orphanedPillars || [],
    dimensions: orphanedDimensions || [],
    questions: orphanedQuestions || [],
  }
}

export async function reassignOrphaned(
  tableName: string,
  itemId: string,
  newParentId: string,
  parentColumn: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(tableName)
    .update({
      status: 'active',
      orphaned_at: null,
      orphaned_reason: null,
      previous_parent_id: null,
      [parentColumn]: newParentId,
    })
    .eq('id', itemId)
    .select()

  if (error) throw error
  return data
}

export async function permanentlyDeleteOrphaned(tableName: string, itemId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from(tableName).delete().eq('id', itemId)

  if (error) throw error
}
