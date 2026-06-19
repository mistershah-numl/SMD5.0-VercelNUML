'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RotateCcw, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Dimension, Question, Pillar } from '@/lib/types/database'

interface OrphanManagerProps {
  versionId: string
  pillars: Pillar[]
  dimensions: Dimension[]
}

interface OrphanedItem {
  id: string
  name?: string
  text?: string
  orphaned_reason: string
  orphaned_at: string
  type: 'dimension' | 'question'
}

export function OrphanManager({
  versionId,
  pillars,
  dimensions,
}: OrphanManagerProps) {
  const [orphans, setOrphans] = useState<{
    dimensions: any[]
    questions: any[]
  }>({
    dimensions: [],
    questions: [],
  })
  const [loading, setLoading] = useState(true)
  const [selectedOrphan, setSelectedOrphan] = useState<OrphanedItem | null>(null)
  const [selectedParentId, setSelectedParentId] = useState<string>('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchOrphans()
  }, [versionId])

  const fetchOrphans = async () => {
    try {
      const res = await fetch(
        `/api/admin/orphans?index_version_id=${versionId}`
      )
      if (res.ok) {
        const data = await res.json()
        setOrphans({
          dimensions: data.orphaned_dimensions || [],
          questions: data.orphaned_questions || [],
        })
      }
    } catch (error) {
      console.error('[v0] Error fetching orphans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRecover = async () => {
    if (!selectedOrphan) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/orphans/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: selectedOrphan.id,
          item_type: selectedOrphan.type,
          new_parent_id: selectedParentId || null,
          index_version_id: versionId,
        }),
      })

      if (res.ok) {
        fetchOrphans()
        setSelectedOrphan(null)
        setSelectedParentId('')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('[v0] Error recovering orphan:', error)
      alert('Failed to recover orphaned item')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (orphan: OrphanedItem) => {
    if (!confirm(`Are you sure you want to permanently delete this ${orphan.type}?`)) {
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/orphans/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: orphan.id,
          item_type: orphan.type,
          index_version_id: versionId,
        }),
      })

      if (res.ok) {
        fetchOrphans()
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('[v0] Error deleting orphan:', error)
      alert('Failed to delete orphaned item')
    } finally {
      setActionLoading(false)
    }
  }

  const totalOrphans = orphans.dimensions.length + orphans.questions.length

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading orphaned items...</p>
        </CardContent>
      </Card>
    )
  }

  if (totalOrphans === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No orphaned items. Your assessment structure is clean!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <CardTitle className="text-amber-900">
                {totalOrphans} Orphaned Item{totalOrphans !== 1 ? 's' : ''}
              </CardTitle>
              <CardDescription className="text-amber-800">
                These items were orphaned when their parent was deleted. You can recover them
                or permanently delete them.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {orphans.dimensions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-amber-900">
                Orphaned Dimensions ({orphans.dimensions.length})
              </h3>
              <div className="space-y-2">
                {orphans.dimensions.map((dim) => (
                  <div
                    key={dim.id}
                    className="flex items-center justify-between p-3 bg-white rounded border border-amber-200"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{dim.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Orphaned: {new Date(dim.orphaned_at).toLocaleDateString()} •{' '}
                        {dim.orphaned_reason}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrphan({
                            id: dim.id,
                            name: dim.name,
                            orphaned_reason: dim.orphaned_reason,
                            orphaned_at: dim.orphaned_at,
                            type: 'dimension',
                          })
                        }}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Recover
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleDelete({
                            id: dim.id,
                            name: dim.name,
                            orphaned_reason: dim.orphaned_reason,
                            orphaned_at: dim.orphaned_at,
                            type: 'dimension',
                          })
                        }
                        disabled={actionLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {orphans.questions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-amber-900">
                Orphaned Questions ({orphans.questions.length})
              </h3>
              <div className="space-y-2">
                {orphans.questions.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-3 bg-white rounded border border-amber-200"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm line-clamp-1">{q.text}</p>
                      <p className="text-xs text-muted-foreground">
                        Orphaned: {new Date(q.orphaned_at).toLocaleDateString()} •{' '}
                        {q.orphaned_reason}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrphan({
                            id: q.id,
                            text: q.text,
                            orphaned_reason: q.orphaned_reason,
                            orphaned_at: q.orphaned_at,
                            type: 'question',
                          })
                        }}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Recover
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleDelete({
                            id: q.id,
                            text: q.text,
                            orphaned_reason: q.orphaned_reason,
                            orphaned_at: q.orphaned_at,
                            type: 'question',
                          })
                        }
                        disabled={actionLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recovery Dialog */}
      <Dialog open={!!selectedOrphan} onOpenChange={() => setSelectedOrphan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recover Orphaned Item</DialogTitle>
            <DialogDescription>
              {selectedOrphan?.type === 'dimension'
                ? 'Assign this dimension to a pillar (or leave empty for standalone)'
                : 'Assign this question to a dimension (or leave empty for standalone)'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedOrphan?.type === 'dimension' ? (
              <>
                <p className="text-sm font-medium">
                  Dimension: <span className="font-bold">{selectedOrphan.name}</span>
                </p>
                {pillars.length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Select Pillar</label>
                    <select
                      value={selectedParentId}
                      onChange={(e) => setSelectedParentId(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                    >
                      <option value="">None (Standalone)</option>
                      {pillars.map((pillar) => (
                        <option key={pillar.id} value={pillar.id}>
                          {pillar.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-medium">
                  Question: <span className="font-bold line-clamp-2">{selectedOrphan?.text}</span>
                </p>
                {dimensions.length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Select Dimension</label>
                    <select
                      value={selectedParentId}
                      onChange={(e) => setSelectedParentId(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                    >
                      <option value="">None (Standalone)</option>
                      {dimensions.map((dim) => (
                        <option key={dim.id} value={dim.id}>
                          {dim.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <Button
              onClick={handleRecover}
              disabled={actionLoading}
              className="w-full"
            >
              {actionLoading ? 'Recovering...' : 'Recover Item'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
