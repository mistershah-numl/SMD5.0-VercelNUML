import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ScoreCardProps {
  title: string
  score: number
  maxScore?: number
  description?: string
  color?: string
  showPercentage?: boolean
  children?: React.ReactNode
}

export function ScoreCard({
  title,
  score,
  maxScore = 100,
  description,
  color,
  showPercentage = true,
  children,
}: ScoreCardProps) {
  const percentage = (score / maxScore) * 100

  // Determine color based on score if not provided
  let backgroundColor = color
  if (!backgroundColor) {
    if (percentage >= 75) {
      backgroundColor = '#10b981' // green
    } else if (percentage >= 50) {
      backgroundColor = '#f59e0b' // amber
    } else if (percentage >= 25) {
      backgroundColor = '#f97316' // orange
    } else {
      backgroundColor = '#ef4444' // red
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <span className="text-sm font-medium text-gray-600">Score</span>
            <span className="text-3xl font-bold">{score.toFixed(1)}</span>
          </div>
          {showPercentage && (
            <span className="text-sm text-gray-500">{percentage.toFixed(0)}% of maximum</span>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              backgroundColor,
              width: `${Math.min(percentage, 100)}%`,
            }}
          />
        </div>

        {children}
      </CardContent>
    </Card>
  )
}
