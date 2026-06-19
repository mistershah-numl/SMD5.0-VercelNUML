'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react'

interface Question {
  id: string
  text: string
  question_type: string
  weight: number
  status: string
  question_options: any[]
}

interface Dimension {
  id: string
  name: string
  weight: number
  status: string
  questions: Question[]
  description?: string
}

interface Pillar {
  id: string
  name: string
  weight: number
  status: string
  dimensions: Dimension[]
  description?: string
}

interface IndexVersion {
  id: string
  name: string
  version: string
  description?: string
  pillars: Pillar[]
}

export function VersionEditor({ versionId }: { versionId: string }) {
  const [hierarchy, setHierarchy] = useState<IndexVersion | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedPillars, setExpandedPillars] = useState<Set<string>>(new Set())
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchHierarchy()
  }, [versionId])

  const fetchHierarchy = async () => {
    try {
      const res = await fetch(
        `/api/admin/index-versions/${versionId}?structure=true`
      )
      if (res.ok) {
        const data = await res.json()
        setHierarchy(data)
      }
    } catch (error) {
      console.error('[v0] Error fetching hierarchy:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePillar = (pillarId: string) => {
    const newExpanded = new Set(expandedPillars)
    if (newExpanded.has(pillarId)) {
      newExpanded.delete(pillarId)
    } else {
      newExpanded.add(pillarId)
    }
    setExpandedPillars(newExpanded)
  }

  const toggleDimension = (dimensionId: string) => {
    const newExpanded = new Set(expandedDimensions)
    if (newExpanded.has(dimensionId)) {
      newExpanded.delete(dimensionId)
    } else {
      newExpanded.add(dimensionId)
    }
    setExpandedDimensions(newExpanded)
  }

  const handleDeletePillar = async (pillarId: string) => {
    if (!confirm('Delete this pillar? Child dimensions will be orphaned.')) return

    try {
      const res = await fetch(`/api/admin/pillars/${pillarId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchHierarchy()
      }
    } catch (error) {
      console.error('[v0] Error deleting pillar:', error)
    }
  }

  const handleDeleteDimension = async (dimensionId: string) => {
    if (!confirm('Delete this dimension? Child questions will be orphaned.')) return

    try {
      const res = await fetch(`/api/admin/dimensions/${dimensionId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchHierarchy()
      }
    } catch (error) {
      console.error('[v0] Error deleting dimension:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading hierarchy...</div>
  }

  if (!hierarchy) {
    return <div className="text-center py-8 text-red-600">Failed to load hierarchy</div>
  }

  return (
    <div className="space-y-4">
      {/* Version Info */}
      <Card>
        <CardHeader>
          <CardTitle>{hierarchy.name}</CardTitle>
          <CardDescription>v{hierarchy.version}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">{hierarchy.description}</p>
          <p className="text-sm text-gray-600">
            Pillars: {hierarchy.pillars?.length || 0}
          </p>
        </CardContent>
      </Card>

      {/* Pillars */}
      <div className="space-y-2">
        {hierarchy.pillars && hierarchy.pillars.length > 0 ? (
          hierarchy.pillars.map((pillar) => (
            <Card key={pillar.id} className="overflow-hidden">
              <div
                className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                onClick={() => togglePillar(pillar.id)}
              >
                <div className="flex items-center gap-2 flex-1">
                  {expandedPillars.has(pillar.id) ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                  <div>
                    <h3 className="font-semibold">{pillar.name}</h3>
                    <p className="text-xs text-gray-500">
                      Weight: {pillar.weight} | Dimensions: {pillar.dimensions?.length || 0}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePillar(pillar.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              {/* Dimensions */}
              {expandedPillars.has(pillar.id) && (
                <CardContent className="pt-4 space-y-2 bg-gray-50 border-t">
                  {pillar.dimensions && pillar.dimensions.length > 0 ? (
                    pillar.dimensions.map((dimension) => (
                      <div
                        key={dimension.id}
                        className="bg-white border border-gray-200 rounded p-3 ml-4"
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className="flex items-center gap-2 flex-1 cursor-pointer"
                            onClick={() => toggleDimension(dimension.id)}
                          >
                            {expandedDimensions.has(dimension.id) ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                            <div>
                              <h4 className="font-medium text-sm">{dimension.name}</h4>
                              <p className="text-xs text-gray-500">
                                Weight: {dimension.weight} | Questions: {dimension.questions?.length || 0}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDimension(dimension.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>

                        {/* Questions */}
                        {expandedDimensions.has(dimension.id) && (
                          <div className="mt-3 ml-4 space-y-2">
                            {dimension.questions && dimension.questions.length > 0 ? (
                              dimension.questions.map((question) => (
                                <div
                                  key={question.id}
                                  className="bg-blue-50 border border-blue-200 rounded p-2 text-xs"
                                >
                                  <p className="font-medium">{question.text}</p>
                                  <p className="text-gray-600">
                                    Type: {question.question_type} | Weight: {question.weight}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-gray-500 italic">No questions yet</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">No dimensions yet</p>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600">No pillars created yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
