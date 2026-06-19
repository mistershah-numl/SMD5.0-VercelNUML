/**
 * Database types for SDM5 Assessment Platform
 */

export interface Company {
  id: string
  name: string
  description?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface IndexVersion {
  id: string
  company_id: string
  name: string
  version: string
  description?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Pillar {
  id: string
  index_version_id: string
  name: string
  description?: string
  weight: number
  status: 'active' | 'orphaned'
  orphaned_at?: string
  orphaned_reason?: 'pillar_deleted' | 'version_deleted' | 'manual'
  previous_parent_id?: string
  order_index?: number
  created_at: string
  updated_at: string
}

export interface Dimension {
  id: string
  pillar_id?: string
  index_version_id: string
  name: string
  description?: string
  weight: number
  status: 'active' | 'orphaned'
  orphaned_at?: string
  orphaned_reason?: 'pillar_deleted' | 'version_deleted' | 'manual'
  previous_parent_id?: string
  order_index?: number
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  dimension_id?: string
  pillar_id?: string
  index_version_id: string
  text: string
  question_type: 'single-choice' | 'multi-choice' | 'matrix' | 'scale'
  weight: number
  description?: string
  order_index?: number
  status: 'active' | 'orphaned'
  orphaned_at?: string
  orphaned_reason?: 'dimension_deleted' | 'version_deleted' | 'manual'
  previous_parent_id?: string
  created_at: string
  updated_at: string
}

export interface QuestionOption {
  id: string
  question_id: string
  text: string
  value?: number
  order_index?: number
  created_at: string
}

export interface MaturityLevel {
  id: string
  index_version_id: string
  level: number
  name: string
  description?: string
  min_score?: number
  max_score?: number
  created_at: string
}

export interface ScoringFormula {
  id: string
  index_version_id: string
  name: string
  description?: string
  type: 'simple' | 'complex'
  applies_to: 'dimension' | 'pillar' | 'indexversion'
  formula_config: Record<string, any>
  created_by: string
  created_at: string
  updated_at: string
}

export interface SurveyResponse {
  id: string
  company_id: string
  index_version_id: string
  respondent_id: string
  status: 'in_progress' | 'completed'
  initiated_at: string
  submitted_at?: string
  created_at: string
  updated_at: string
}

export interface SurveyAnswer {
  id: string
  response_id: string
  question_id: string
  answer_value?: string
  answered_at: string
  created_at: string
}

export interface SurveyScore {
  id: string
  response_id: string
  dimension_id?: string
  pillar_id?: string
  index_version_id: string
  calculated_score?: number
  maturity_level?: number
  formula_id?: string
  breakdown?: Record<string, any>
  created_at: string
  updated_at: string
}

/**
 * Extended types for API responses
 */
export interface IndexVersionWithHierarchy extends IndexVersion {
  pillars: PillarWithDimensions[]
}

export interface PillarWithDimensions extends Pillar {
  dimensions: DimensionWithQuestions[]
}

export interface DimensionWithQuestions extends Dimension {
  questions: QuestionWithOptions[]
}

export interface QuestionWithOptions extends Question {
  options: QuestionOption[]
}

export interface SurveyResponseWithAnswers extends SurveyResponse {
  answers: SurveyAnswer[]
  scores: SurveyScore[]
}
