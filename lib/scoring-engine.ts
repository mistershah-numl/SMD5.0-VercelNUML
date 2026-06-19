export type FormulaOperator = 'sum' | 'avg' | 'weighted_avg' | 'min' | 'max' | 'custom'

export interface ScoringFormula {
  id: string
  index_version_id: string
  name: string
  description?: string
  formula_type: 'pillar' | 'dimension' | 'overall'
  operator: FormulaOperator
  formula_expression?: string // For custom formulas
  maturity_mapping?: Record<string, number> // Map maturity levels to scores
  min_score?: number
  max_score?: number
  created_at: string
  updated_at: string
}

export interface MaturityLevel {
  id: string
  index_version_id: string
  level: number
  name: string
  description: string
  color?: string
  created_at: string
}

export interface DimensionScore {
  dimension_id: string
  dimension_name: string
  raw_score: number
  weight: number
  weighted_score: number
  maturity_level: number
}

export interface PillarScore {
  pillar_id: string
  pillar_name: string
  raw_score: number
  weight: number
  weighted_score: number
  dimension_scores: DimensionScore[]
  maturity_level: number
}

export interface AssessmentScore {
  overall_score: number
  overall_maturity_level: number
  pillar_scores: PillarScore[]
  completeness: number // % of questions answered
  calculated_at: string
}

export class ScoringEngine {
  private formulas: Map<string, ScoringFormula> = new Map()
  private maturityLevels: Map<string, MaturityLevel[]> = new Map()

  registerFormula(formula: ScoringFormula) {
    this.formulas.set(formula.id, formula)
  }

  registerMaturityLevels(indexVersionId: string, levels: MaturityLevel[]) {
    this.maturityLevels.set(indexVersionId, levels.sort((a, b) => a.level - b.level))
  }

  /**
   * Calculate dimension score from question responses
   */
  calculateDimensionScore(
    dimension_id: string,
    dimension_name: string,
    dimension_weight: number,
    questionResponses: {
      question_id: string
      value: number
      question_weight: number
    }[]
  ): DimensionScore {
    if (questionResponses.length === 0) {
      return {
        dimension_id,
        dimension_name,
        raw_score: 0,
        weight: dimension_weight,
        weighted_score: 0,
        maturity_level: 0,
      }
    }

    // Calculate weighted average of question responses
    const totalWeight = questionResponses.reduce((sum, q) => sum + q.question_weight, 0)
    const rawScore =
      totalWeight > 0
        ? questionResponses.reduce((sum, q) => sum + q.value * q.question_weight, 0) /
          totalWeight
        : 0

    const weightedScore = rawScore * dimension_weight
    const maturityLevel = this.scoreToMaturityLevel(dimension_id, rawScore)

    return {
      dimension_id,
      dimension_name,
      raw_score: Math.round(rawScore * 100) / 100,
      weight: dimension_weight,
      weighted_score: Math.round(weightedScore * 100) / 100,
      maturity_level,
    }
  }

  /**
   * Calculate pillar score from dimension scores
   */
  calculatePillarScore(
    pillar_id: string,
    pillar_name: string,
    pillar_weight: number,
    dimensionScores: DimensionScore[]
  ): PillarScore {
    if (dimensionScores.length === 0) {
      return {
        pillar_id,
        pillar_name,
        raw_score: 0,
        weight: pillar_weight,
        weighted_score: 0,
        dimension_scores: [],
        maturity_level: 0,
      }
    }

    // Calculate weighted average of dimension scores
    const totalWeight = dimensionScores.reduce((sum, d) => sum + d.weight, 0)
    const rawScore =
      totalWeight > 0
        ? dimensionScores.reduce((sum, d) => sum + d.raw_score * d.weight, 0) / totalWeight
        : 0

    const weightedScore = rawScore * pillar_weight
    const maturityLevel = this.scoreToMaturityLevel(pillar_id, rawScore)

    return {
      pillar_id,
      pillar_name,
      raw_score: Math.round(rawScore * 100) / 100,
      weight: pillar_weight,
      weighted_score: Math.round(weightedScore * 100) / 100,
      dimension_scores: dimensionScores,
      maturity_level,
    }
  }

  /**
   * Calculate overall assessment score
   */
  calculateOverallScore(pillarScores: PillarScore[], indexVersionId: string): AssessmentScore {
    if (pillarScores.length === 0) {
      return {
        overall_score: 0,
        overall_maturity_level: 0,
        pillar_scores: [],
        completeness: 0,
        calculated_at: new Date().toISOString(),
      }
    }

    // Calculate weighted average of pillar scores
    const totalWeight = pillarScores.reduce((sum, p) => sum + p.weight, 0)
    const overallScore =
      totalWeight > 0
        ? pillarScores.reduce((sum, p) => sum + p.weighted_score, 0) / totalWeight
        : 0

    const overallMaturityLevel = this.scoreToMaturityLevel(indexVersionId, overallScore)

    // Calculate completeness (how many questions were answered vs total)
    const totalQuestions = pillarScores.reduce(
      (sum, p) =>
        sum +
        p.dimension_scores.reduce(
          (dimSum, d) =>
            dimSum + (d.raw_score > 0 ? 1 : 0), // Count answered questions
          0
        ),
      0
    )

    const completeness = totalQuestions > 0 ? (totalQuestions / 100) * 100 : 0 // Adjust divisor based on actual total

    return {
      overall_score: Math.round(overallScore * 100) / 100,
      overall_maturity_level: overallMaturityLevel,
      pillar_scores: pillarScores,
      completeness: Math.round(completeness * 100) / 100,
      calculated_at: new Date().toISOString(),
    }
  }

  /**
   * Convert a numeric score to a maturity level
   */
  private scoreToMaturityLevel(indexVersionId: string, score: number): number {
    const levels = this.maturityLevels.get(indexVersionId) || []

    if (levels.length === 0) {
      // Default: 1-5 scale based on 0-100 score
      if (score < 20) return 1
      if (score < 40) return 2
      if (score < 60) return 3
      if (score < 80) return 4
      return 5
    }

    // Find matching maturity level
    const normalizedScore = score / 100 // Normalize to 0-1

    for (let i = levels.length - 1; i >= 0; i--) {
      if (normalizedScore >= levels[i].level / 100) {
        return levels[i].level
      }
    }

    return levels[0].level
  }

  /**
   * Evaluate a custom formula expression
   */
  evaluateCustomFormula(expression: string, variables: Record<string, number>): number {
    // Simple expression evaluator - can be extended
    let result = expression

    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value))
    }

    try {
      // eslint-disable-next-line no-eval
      return Function('"use strict"; return (' + result + ')')()
    } catch (error) {
      console.error('[v0] Error evaluating formula:', error)
      return 0
    }
  }
}

// Default scoring engine instance
export const defaultScoringEngine = new ScoringEngine()
