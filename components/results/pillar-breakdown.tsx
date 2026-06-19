import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScoreCard } from './score-card'

interface Dimension {
  id: string
  name: string
  weight: number
  score: number
}

interface Pillar {
  id: string
  name: string
  weight: number
  score: number
  dimensions: Dimension[]
}

interface PillarBreakdownProps {
  pillars: Pillar[]
  maxScore?: number
}

function getScoreColor(percentage: number): string {
  if (percentage >= 75) {
    return '#10b981' // green
  } else if (percentage >= 50) {
    return '#f59e0b' // amber
  } else if (percentage >= 25) {
    return '#f97316' // orange
  } else {
    return '#ef4444' // red
  }
}

export function PillarBreakdown({ pillars, maxScore = 100 }: PillarBreakdownProps) {
  if (pillars.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-600 text-center">No pillar data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Pillar Breakdown</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pillars.map((pillar) => {
          const percentage = (pillar.score / maxScore) * 100
          const color = getScoreColor(percentage)

          return (
            <ScoreCard
              key={pillar.id}
              title={pillar.name}
              score={pillar.score}
              maxScore={maxScore}
              color={color}
              description={`Weight: ${(pillar.weight * 100).toFixed(0)}%`}
            >
              {pillar.dimensions && pillar.dimensions.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-600">Dimensions</h4>
                  <div className="space-y-1">
                    {pillar.dimensions.map((dimension) => {
                      const dimPercentage = (dimension.score / maxScore) * 100
                      return (
                        <div key={dimension.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{dimension.name}</span>
                          <span className="font-semibold">
                            {dimension.score.toFixed(1)}
                            <span className="text-gray-500 ml-1">({dimPercentage.toFixed(0)}%)</span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </ScoreCard>
          )
        })}
      </div>
    </div>
  )
}
