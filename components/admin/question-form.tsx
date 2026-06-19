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
import { PlusCircle, X } from 'lucide-react'
import type { Dimension } from '@/lib/types/database'

interface QuestionFormProps {
  versionId: string
  dimensions: Dimension[]
  onQuestionCreated: () => void
}

export function QuestionForm({
  versionId,
  dimensions,
  onQuestionCreated,
}: QuestionFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedDimensionId, setSelectedDimensionId] = useState<string>('')
  const [form, setForm] = useState({
    text: '',
    question_type: 'single-choice' as const,
    weight: 1,
    description: '',
  })
  const [options, setOptions] = useState<Array<{ text: string; value?: number }>>([])

  const addOption = () => {
    setOptions([...options, { text: '' }])
  }

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.text) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          index_version_id: versionId,
          dimension_id: selectedDimensionId || null,
          text: form.text,
          question_type: form.question_type,
          weight: form.weight,
          description: form.description || null,
          question_options:
            form.question_type === 'single-choice' ||
            form.question_type === 'multi-choice'
              ? options.filter((o) => o.text)
              : [],
        }),
      })

      if (res.ok) {
        setForm({
          text: '',
          question_type: 'single-choice',
          weight: 1,
          description: '',
        })
        setOptions([])
        setSelectedDimensionId('')
        setOpen(false)
        onQuestionCreated()
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('[v0] Error creating question:', error)
      alert('Failed to create question')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Question
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Question</DialogTitle>
          <DialogDescription>
            Add a new question to this assessment version
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {dimensions.length > 0 && (
            <div>
              <label className="text-sm font-medium">Dimension (Optional)</label>
              <select
                value={selectedDimensionId}
                onChange={(e) => setSelectedDimensionId(e.target.value)}
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

          <div>
            <label className="text-sm font-medium">Question Text</label>
            <Textarea
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              placeholder="Enter the question..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Question Type</label>
              <select
                value={form.question_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    question_type: e.target.value as any,
                  })
                }
                className="w-full mt-1 px-3 py-2 border border-border rounded-md"
              >
                <option value="single-choice">Single Choice</option>
                <option value="multi-choice">Multiple Choice</option>
                <option value="scale">Scale (1-5)</option>
                <option value="matrix">Matrix</option>
              </select>
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
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Optional description for respondents..."
            />
          </div>

          {(form.question_type === 'single-choice' ||
            form.question_type === 'multi-choice') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Options</label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addOption}
                >
                  Add Option
                </Button>
              </div>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option.text}
                      onChange={(e) => {
                        const newOptions = [...options]
                        newOptions[index].text = e.target.value
                        setOptions(newOptions)
                      }}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Question'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
