'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, Edit, Loader2 } from 'lucide-react'
import { FormulaBuilder } from '@/components/admin/formula-builder'
import type { ScoringFormula, MaturityLevel } from '@/lib/types/database'

interface IndexVersion {
  id: string
  name: string
}

export default function FormulasPage() {
  const [versions, setVersions] = useState<IndexVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string>('')
  const [formulas, setFormulas] = useState<ScoringFormula[]>([])
  const [maturityLevels, setMaturityLevels] = useState<MaturityLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // UI State
  const [showFormulaBuilder, setShowFormulaBuilder] = useState(false)
  const [editingFormula, setEditingFormula] = useState<ScoringFormula | null>(null)
  const [showMaturityForm, setShowMaturityForm] = useState(false)
  const [editingLevel, setEditingLevel] = useState<MaturityLevel | null>(null)

  // Maturity Form
  const [maturityForm, setMaturityForm] = useState({
    level: 1,
    name: '',
    description: '',
    color: '#3b82f6',
  })

  useEffect(() => {
    const initLoad = async () => {
      await loadVersions()
    }
    initLoad()
  }, [])

  useEffect(() => {
    if (selectedVersion) {
      const loadData = async () => {
        await loadFormulas()
        await loadMaturityLevels()
      }
      loadData()
    }
  }, [selectedVersion])

  const loadVersions = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/index-versions`)
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to load versions')
      }
      const data = await res.json()
      setVersions(data || [])
      if (data && data.length > 0) {
        setSelectedVersion(data[0].id)
      }
    } catch (err) {
      console.error('[v0] Error loading versions:', err)
      setError(err instanceof Error ? err.message : 'Error loading versions')
    } finally {
      setLoading(false)
    }
  }

  const loadFormulas = async () => {
    try {
      const res = await fetch(
        `/api/admin/scoring-formulas?index_version_id=${selectedVersion}`
      )
      if (!res.ok) throw new Error('Failed to load formulas')
      const data = await res.json()
      setFormulas(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading formulas')
    }
  }

  const loadMaturityLevels = async () => {
    try {
      const res = await fetch(
        `/api/admin/maturity-levels?index_version_id=${selectedVersion}`
      )
      if (!res.ok) throw new Error('Failed to load maturity levels')
      const data = await res.json()
      setMaturityLevels(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading maturity levels')
    }
  }

  const handleSaveFormula = async (formularData: Partial<ScoringFormula>) => {
    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      const payload = {
        ...formularData,
        index_version_id: selectedVersion,
      }

      if (editingFormula) {
        // Update
        const res = await fetch(`/api/admin/scoring-formulas/${editingFormula.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to update formula')
      } else {
        // Create
        const res = await fetch('/api/admin/scoring-formulas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to create formula')
      }

      setSuccess(editingFormula ? 'Formula updated' : 'Formula created')
      setShowFormulaBuilder(false)
      setEditingFormula(null)
      loadFormulas()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving formula')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteFormula = async (id: string) => {
    if (!confirm('Delete this formula?')) return

    try {
      setError('')
      const res = await fetch(`/api/admin/scoring-formulas/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete formula')
      setSuccess('Formula deleted')
      loadFormulas()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting formula')
    }
  }

  const handleSaveMaturityLevel = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      const payload = {
        ...maturityForm,
        index_version_id: selectedVersion,
      }

      if (editingLevel) {
        // Update
        const res = await fetch(`/api/admin/maturity-levels/${editingLevel.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to update maturity level')
      } else {
        // Create
        const res = await fetch('/api/admin/maturity-levels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to create maturity level')
      }

      setSuccess(editingLevel ? 'Level updated' : 'Level created')
      setShowMaturityForm(false)
      setEditingLevel(null)
      setMaturityForm({ level: 1, name: '', description: '', color: '#3b82f6' })
      loadMaturityLevels()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving maturity level')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMaturityLevel = async (id: string) => {
    if (!confirm('Delete this maturity level?')) return

    try {
      setError('')
      const res = await fetch(`/api/admin/maturity-levels/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete maturity level')
      setSuccess('Maturity level deleted')
      loadMaturityLevels()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting maturity level')
    }
  }

  const handleEditFormula = (formula: ScoringFormula) => {
    setEditingFormula(formula)
    setShowFormulaBuilder(true)
  }

  const handleEditMaturityLevel = (level: MaturityLevel) => {
    setEditingLevel(level)
    setMaturityForm({
      level: level.level,
      name: level.name,
      description: level.description || '',
      color: level.color || '#3b82f6',
    })
    setShowMaturityForm(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Scoring & Maturity Configuration</h2>
        <p className="text-gray-600 mt-2">Define scoring formulas and maturity levels per index version</p>
      </div>

      {/* Version Selector or Loading */}
      {loading ? (
        <Card>
          <CardContent className="pt-6 flex items-center gap-2">
            <Loader2 className="animate-spin" size={20} />
            <span>Loading versions...</span>
          </CardContent>
        </Card>
      ) : versions.length === 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-amber-800">
              No index versions found. Please create an index version first.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label className="font-medium">Index Version:</label>
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-red-800">{error}</CardContent>
        </Card>
      )}
      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-green-800">{success}</CardContent>
        </Card>
      )}

      {/* Tabs - Only show if version is selected */}
      {selectedVersion && (
        <Tabs defaultValue="formulas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="formulas">Scoring Formulas</TabsTrigger>
            <TabsTrigger value="maturity">Maturity Levels</TabsTrigger>
          </TabsList>

          {/* Scoring Formulas Tab */}
          <TabsContent value="formulas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Scoring Formulas</h3>
            <Button
              onClick={() => {
                setEditingFormula(null)
                setShowFormulaBuilder(!showFormulaBuilder)
              }}
              disabled={submitting}
            >
              <Plus size={18} className="mr-2" />
              {showFormulaBuilder ? 'Cancel' : 'New Formula'}
            </Button>
          </div>

          {/* Formula Builder */}
          {showFormulaBuilder && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingFormula ? 'Edit Scoring Formula' : 'Create Scoring Formula'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormulaBuilder
                  formula={editingFormula || undefined}
                  onSave={async (data) => {
                    await handleSaveFormula(data)
                  }}
                  onCancel={() => {
                    setShowFormulaBuilder(false)
                    setEditingFormula(null)
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Formulas List */}
          {formulas.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600">No scoring formulas configured yet</p>
                <p className="text-sm text-gray-500 mt-2">Create your first formula to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formulas.map((formula) => (
                <Card key={formula.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{formula.name}</CardTitle>
                        <CardDescription>
                          {formula.formula_type} • {formula.operator}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">{formula.description}</p>
                    {formula.formula_expression && (
                      <p className="text-xs font-mono bg-gray-100 p-2 rounded">
                        {formula.formula_expression}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditFormula(formula)}
                        disabled={submitting}
                      >
                        <Edit size={16} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteFormula(formula.id)}
                        disabled={submitting}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}
          </TabsContent>

          {/* Maturity Levels Tab */}
          <TabsContent value="maturity" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Maturity Levels</h3>
            <Button
              onClick={() => {
                setEditingLevel(null)
                setMaturityForm({ level: 1, name: '', description: '', color: '#3b82f6' })
                setShowMaturityForm(!showMaturityForm)
              }}
              disabled={submitting}
            >
              <Plus size={18} className="mr-2" />
              {showMaturityForm ? 'Cancel' : 'New Level'}
            </Button>
          </div>

          {/* Maturity Form */}
          {showMaturityForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingLevel ? 'Edit Maturity Level' : 'Create Maturity Level'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveMaturityLevel} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Level</label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={maturityForm.level}
                        onChange={(e) =>
                          setMaturityForm({
                            ...maturityForm,
                            level: parseInt(e.target.value),
                          })
                        }
                        required
                        disabled={editingLevel !== null}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Color</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={maturityForm.color}
                          onChange={(e) =>
                            setMaturityForm({
                              ...maturityForm,
                              color: e.target.value,
                            })
                          }
                          className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                        />
                        <span className="text-sm text-gray-600">{maturityForm.color}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Level Name</label>
                    <Input
                      placeholder="e.g., Initial, Managed, Optimized"
                      value={maturityForm.name}
                      onChange={(e) =>
                        setMaturityForm({ ...maturityForm, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      placeholder="Describe what this maturity level represents"
                      value={maturityForm.description}
                      onChange={(e) =>
                        setMaturityForm({
                          ...maturityForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : editingLevel ? (
                        'Update Level'
                      ) : (
                        'Create Level'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowMaturityForm(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Maturity Levels List */}
          {maturityLevels.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600">No maturity levels configured yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Create maturity levels to classify assessment results
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {maturityLevels.map((level) => (
                <Card key={level.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: level.color || '#3b82f6' }}
                        />
                        <div>
                          <h4 className="font-semibold">
                            Level {level.level}: {level.name}
                          </h4>
                          <p className="text-sm text-gray-600">{level.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditMaturityLevel(level)}
                          disabled={submitting}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteMaturityLevel(level.id)}
                          disabled={submitting}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Info Card */}
      {selectedVersion && (
        <Card>
          <CardHeader>
            <CardTitle>About Scoring Formulas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div>
              <p className="font-semibold text-gray-900">Formula Types:</p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li><strong>Dimension Score:</strong> Calculates from question responses within a dimension</li>
                <li><strong>Pillar Score:</strong> Aggregates dimension scores within a pillar</li>
                <li><strong>Overall Score:</strong> Combines all pillar scores into one assessment score</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Operators:</p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li><strong>Weighted Average:</strong> Uses weights for each component (recommended)</li>
                <li><strong>Average:</strong> Simple mean of all scores</li>
                <li><strong>Sum:</strong> Adds all scores together</li>
                <li><strong>Custom:</strong> Define a JavaScript expression (e.g., pillar_1 * 0.5 + pillar_2 * 0.5)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
