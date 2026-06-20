'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertCircle, Trash2, RefreshCw, FolderClosed, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'

interface OrphanedItem {
  id: string
  name?: string
  text?: string
  status: string
  orphaned_reason: string
  orphaned_at: string
  index_version_id: string
  previous_parent_id?: string
}

function OrphansPageContent() {
  const supabase = createClient()
  const [orphans, setOrphans] = useState<{
    pillars: OrphanedItem[]
    dimensions: OrphanedItem[]
    questions: OrphanedItem[]
  }>({ pillars: [], dimensions: [], questions: [] })
  
  const [activePillars, setActivePillars] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [recoveringId, setRecoveringId] = useState<string | null>(null)
  const [selectedParentId, setSelectedParentId] = useState<string>('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchOrphans()
    loadPillarOptions()
  }, [])

  const fetchOrphans = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/orphans')
      if (res.ok) {
        const data = await res.json()
        setOrphans({
          pillars: data.pillars || [],
          dimensions: data.dimensions || [],
          questions: data.questions || []
        })
      }
    } catch (error) {
      console.error('Error fetching orphans:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPillarOptions = async () => {
    // Load existing target pillars so you have a quick recovery destination dropdown menu
    const { data } = await supabase.from('pillars').select('id, name').eq('status', 'active')
    setActivePillars(data || [])
  }

  const handleDeleteOrphaned = async (id: string, tableName: string) => {
    if (!confirm('Permanently delete this orphaned item row? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/admin/orphans/${id}?table_name=${tableName}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchOrphans()
      }
    } catch (error) {
      console.error('Error deleting orphan:', error)
    }
  }

  const handleExecuteRecovery = async (itemId: string, indexVersionId: string) => {
    if (!selectedParentId) return
    try {
      // Direct integration call to your internal /api/admin/orphans/recover endpoint
      const res = await fetch('/api/admin/orphans/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: itemId,
          item_type: 'dimension',
          new_parent_id: selectedParentId,
          index_version_id: indexVersionId
        })
      })

      if (res.ok) {
        setShowModal(false)
        setSelectedParentId('')
        fetchOrphans()
      }
    } catch (error) {
      console.error('Recovery failed:', error)
    }
  }

  const totalOrphans = orphans.pillars.length + orphans.dimensions.length + orphans.questions.length

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse">Scanning database hierarchy trees for orphans...</div>
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <AlertCircle size={28} className="text-orange-600 animate-bounce" />
            Orphan Recovery Center
          </h2>
          <p className="text-gray-600 mt-1">
            Reassign or delete dimensions and questions detached by historical pillar deletions.
          </p>
        </div>
        <Button variant="outline" onClick={fetchOrphans} className="gap-2 shadow-sm">
          <RefreshCw size={16} /> Sync Changes
        </Button>
      </div>

      {/* Grid Dashboard Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-muted/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Orphaned Components</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-extrabold text-foreground">{totalOrphans}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Orphaned Dimensions</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-extrabold text-orange-600">{orphans.dimensions.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Orphaned Questions</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-extrabold text-orange-600">{orphans.questions.length}</div></CardContent>
        </Card>
      </div>

      {totalOrphans === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-gray-600 font-medium text-lg">No orphaned records found</p>
            <p className="text-sm text-muted-foreground mt-1">Your Industry 5.0 database tree structure is clean!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Dimensions Recovery Block */}
          {orphans.dimensions.length > 0 && (
            <Card className="border-orange-200 shadow-sm">
              <CardHeader className="bg-orange-50/50">
                <CardTitle className="text-orange-900">Disconnected Dimensions Matrix ({orphans.dimensions.length})</CardTitle>
                <CardDescription className="text-orange-700">These elements lost their parent links. Recover them by mounting them to an active pillar target category.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {orphans.dimensions.map((dimension) => (
                  <div key={dimension.id} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:border-orange-300 transition-colors">
                    <div className="space-y-1">
                      <p className="font-bold text-foreground flex items-center gap-1.5"><FolderClosed size={16} className="text-orange-500" /> {dimension.name}</p>
                      <p className="text-xs text-muted-foreground">Reason: <span className="text-foreground font-medium">{dimension.orphaned_reason || 'Pillar Dropped'}</span> • Logged: {new Date(dimension.orphaned_at).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      {/* Recovery Trigger Dropdown Modal Container */}
                      <Dialog open={showModal && recoveringId === dimension.id} onOpenChange={(open) => { setShowModal(open); if(!open) setRecoveringId(null); }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => setRecoveringId(dimension.id)}>
                            Recover Item
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Mount Dimension to Pillar Category</DialogTitle>
                            <DialogDescription>Select a target parent path index to successfully reassign <strong>{dimension.name}</strong>.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <select 
                              value={selectedParentId} 
                              onChange={(e) => setSelectedParentId(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                            >
                              <option value="">-- Choose Target Parent Pillar --</option>
                              {activePillars.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                            <Button className="w-full gap-2 text-white" disabled={!selectedParentId} onClick={() => handleExecuteRecovery(dimension.id, dimension.index_version_id)}>
                              <CheckCircle size={16} /> Reattach to Structure Hierarchy
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button variant="outline" size="sm" onClick={() => handleDeleteOrphaned(dimension.id, 'dimensions')} className="text-destructive hover:bg-destructive/10 border-destructive/20">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Downstream Questions Recovery Block */}
          {orphans.questions.length > 0 && (
            <Card className="border-orange-200 shadow-sm">
              <CardHeader className="bg-orange-50/50">
                <CardTitle className="text-orange-900">Disconnected Questions List ({orphans.questions.length})</CardTitle>
                <CardDescription className="text-orange-700">These specific metrics were detached. Delete them permanently or hook them up to recovered parameters inside your framework editor pages.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {orphans.questions.map((question) => (
                  <div key={question.id} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                    <div className="space-y-1 flex-1 pr-4">
                      <p className="font-medium text-sm text-foreground">{question.text}</p>
                      <p className="text-xs text-muted-foreground">Parent Cascade ID: {question.previous_parent_id || 'N/A'}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteOrphaned(question.id, 'questions')} className="text-destructive hover:bg-destructive/10 border-destructive/20">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

const OrphansPage = dynamic(() => Promise.resolve(OrphansPageContent), { ssr: false })
export default OrphansPage