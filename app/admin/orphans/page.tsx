'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Trash2, MoveRight } from 'lucide-react'

interface OrphanedItem {
  id: string
  name?: string
  text?: string
  status: string
  orphaned_reason: string
  orphaned_at: string
  previous_parent_id?: string
}

export default function OrphansPage() {
  const [orphans, setOrphans] = useState<{
    pillars: OrphanedItem[]
    dimensions: OrphanedItem[]
    questions: OrphanedItem[]
  }>({ pillars: [], dimensions: [], questions: [] })
  const [loading, setLoading] = useState(true)
  const [reassignMode, setReassignMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [availablePillars, setAvailablePillars] = useState<any[]>([])
  const [selectedNewParent, setSelectedNewParent] = useState<string>('')

  useEffect(() => {
    fetchOrphans()
  }, [])

  const fetchOrphans = async () => {
    try {
      const res = await fetch('/api/admin/orphans')
      if (res.ok) {
        const data = await res.json()
        setOrphans(data)
      }
    } catch (error) {
      console.error('[v0] Error fetching orphans:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailablePillars = async () => {
    // This would need to be enhanced to fetch available pillars from a specific version
    // For now, we'll keep it simple
  }

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const handleDeleteOrphaned = async (id: string, tableName: string) => {
    if (!confirm('Permanently delete this orphaned item?')) return

    try {
      const res = await fetch(`/api/admin/orphans/${id}?table_name=${tableName}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchOrphans()
      }
    } catch (error) {
      console.error('[v0] Error deleting orphan:', error)
    }
  }

  const totalOrphans =
    orphans.pillars.length + orphans.dimensions.length + orphans.questions.length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <AlertCircle size={28} className="text-orange-600" />
          Orphan Recovery Center
        </h2>
        <p className="text-gray-600 mt-2">
          Manage items that have become orphaned due to deletions
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Orphaned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalOrphans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pillars</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{orphans.pillars.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Dimensions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{orphans.dimensions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{orphans.questions.length}</div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading orphaned items...</div>
      ) : totalOrphans === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">No orphaned items found</p>
            <p className="text-sm text-gray-500 mt-2">Your hierarchy is clean!</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Orphaned Pillars */}
          {orphans.pillars.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Orphaned Pillars ({orphans.pillars.length})</CardTitle>
                <CardDescription>
                  These pillars were orphaned when their parent index version was deleted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {orphans.pillars.map((pillar) => (
                    <div
                      key={pillar.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{pillar.name}</p>
                        <p className="text-xs text-gray-500">
                          {pillar.orphaned_reason} • {new Date(pillar.orphaned_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteOrphaned(pillar.id, 'pillars')}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Orphaned Dimensions */}
          {orphans.dimensions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Orphaned Dimensions ({orphans.dimensions.length})</CardTitle>
                <CardDescription>
                  These dimensions were orphaned when their parent pillar was deleted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {orphans.dimensions.map((dimension) => (
                    <div
                      key={dimension.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{dimension.name}</p>
                        <p className="text-xs text-gray-500">
                          {dimension.orphaned_reason} • {new Date(dimension.orphaned_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteOrphaned(dimension.id, 'dimensions')}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Orphaned Questions */}
          {orphans.questions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Orphaned Questions ({orphans.questions.length})</CardTitle>
                <CardDescription>
                  These questions were orphaned when their parent dimension was deleted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {orphans.questions.map((question) => (
                    <div
                      key={question.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{question.text}</p>
                        <p className="text-xs text-gray-500">
                          {question.orphaned_reason} • {new Date(question.orphaned_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteOrphaned(question.id, 'questions')}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
