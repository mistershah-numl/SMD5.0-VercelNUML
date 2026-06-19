'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PlusCircle } from 'lucide-react'
import type { Pillar } from '@/lib/types/database'

interface DimensionFormProps {
  versionId: string
  pillars: Pillar[]
  onDimensionCreated: () => void
}

export function DimensionForm({
  versionId,
  pillars,
  onDimensionCreated,
}: DimensionFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedPillarId, setSelectedPillarId] = useState<string>('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    weight: 1,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/dimensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          index_version_id: versionId,
          pillar_id: selectedPillarId || null,
          name: form.name,
          description: form.description || null,
          weight: form.weight,
        }),
      })

      if (res.ok) {
        setForm({ name: '', description: '', weight: 1 })
        setSelectedPillarId('')
        setOpen(false)
        onDimensionCreated()
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('[v0] Error creating dimension:', error)
      alert('Failed to create dimension')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Dimension
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Dimension</DialogTitle>
          <DialogDescription>
            Add a new dimension to this assessment version
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {pillars.length > 0 && (
            <div>
              <label className="text-sm font-medium">Pillar (Optional)</label>
              <select
                value={selectedPillarId}
                onChange={(e) => setSelectedPillarId(e.target.value)}
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
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Strategy Development"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe this dimension..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Weight</label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              value={form.weight}
              onChange={(e) =>
                setForm({ ...form, weight: parseFloat(e.target.value) })
              }
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Dimension'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
