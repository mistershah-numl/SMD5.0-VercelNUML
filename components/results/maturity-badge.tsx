interface MaturityBadgeProps {
  level: number
  name: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
}

export function MaturityBadge({
  level,
  name,
  color = '#3b82f6',
  size = 'md',
}: MaturityBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-lg font-semibold text-white`}
      style={{ backgroundColor: color }}
    >
      Level {level}: {name}
    </div>
  )
}
