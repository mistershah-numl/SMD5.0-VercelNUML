import { createClient } from '@/lib/supabase/server'

export interface HierarchyValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export async function validateHierarchy(indexVersionId: string): Promise<HierarchyValidationResult> {
  const supabase = await createClient()
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Check that all dimensions have a parent pillar (or are orphaned)
    const { data: dimensionsWithoutPillar, error: dimError } = await supabase
      .from('dimensions')
      .select('id, name')
      .eq('index_version_id', indexVersionId)
      .is('pillar_id', null)
      .eq('status', 'active')

    if (dimError) throw dimError

    if (dimensionsWithoutPillar && dimensionsWithoutPillar.length > 0) {
      errors.push(
        `Found ${dimensionsWithoutPillar.length} active dimensions without parent pillars`
      )
    }

    // Check that all questions have a parent dimension (or are orphaned)
    const { data: questionsWithoutDimension, error: qError } = await supabase
      .from('questions')
      .select('id, text')
      .eq('index_version_id', indexVersionId)
      .is('dimension_id', null)
      .eq('status', 'active')

    if (qError) throw qError

    if (questionsWithoutDimension && questionsWithoutDimension.length > 0) {
      errors.push(
        `Found ${questionsWithoutDimension.length} active questions without parent dimensions`
      )
    }

    // Warn about orphaned items that need reassignment
    const { data: orphanedDimensions, error: orphanDimError } = await supabase
      .from('dimensions')
      .select('id, name, orphaned_reason')
      .eq('index_version_id', indexVersionId)
      .eq('status', 'orphaned')

    if (orphanDimError) throw orphanDimError

    if (orphanedDimensions && orphanedDimensions.length > 0) {
      warnings.push(`${orphanedDimensions.length} orphaned dimensions need reassignment`)
    }

    const { data: orphanedQuestions, error: orphanQError } = await supabase
      .from('questions')
      .select('id, text, orphaned_reason')
      .eq('index_version_id', indexVersionId)
      .eq('status', 'orphaned')

    if (orphanQError) throw orphanQError

    if (orphanedQuestions && orphanedQuestions.length > 0) {
      warnings.push(`${orphanedQuestions.length} orphaned questions need reassignment`)
    }

    // Check for unused pillars (pillars with no dimensions)
    const { data: pillars, error: pillarError } = await supabase
      .from('pillars')
      .select('id, name')
      .eq('index_version_id', indexVersionId)
      .eq('status', 'active')

    if (pillarError) throw pillarError

    for (const pillar of pillars || []) {
      const { data: pillarDimensions, error: pdError } = await supabase
        .from('dimensions')
        .select('id')
        .eq('pillar_id', pillar.id)
        .eq('status', 'active')

      if (pdError) throw pdError

      if (!pillarDimensions || pillarDimensions.length === 0) {
        warnings.push(`Pillar "${pillar.name}" has no active dimensions`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  } catch (error) {
    console.error('[v0] Hierarchy validation error:', error)
    return {
      isValid: false,
      errors: ['Error validating hierarchy'],
      warnings,
    }
  }
}

export async function getHierarchyStructure(indexVersionId: string) {
  const supabase = await createClient()

  // Get index version
  const { data: indexVersion, error: versionError } = await supabase
    .from('index_versions')
    .select('*')
    .eq('id', indexVersionId)
    .single()

  if (versionError) throw versionError

  // Get pillars
  const { data: pillars, error: pillarError } = await supabase
    .from('pillars')
    .select('*')
    .eq('index_version_id', indexVersionId)
    .order('order_index', { ascending: true })

  if (pillarError) throw pillarError

  // Build hierarchy
  const hierarchy: any = {
    ...indexVersion,
    pillars: [],
  }

  for (const pillar of pillars || []) {
    const { data: dimensions, error: dimError } = await supabase
      .from('dimensions')
      .select('*')
      .eq('pillar_id', pillar.id)
      .order('order_index', { ascending: true })

    if (dimError) throw dimError

    const pillarData = {
      ...pillar,
      dimensions: [],
    }

    for (const dimension of dimensions || []) {
      const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('*')
        .eq('dimension_id', dimension.id)
        .order('order_index', { ascending: true })

      if (qError) throw qError

      pillarData.dimensions.push({
        ...dimension,
        questions: questions || [],
      })
    }

    hierarchy.pillars.push(pillarData)
  }

  return hierarchy
}
