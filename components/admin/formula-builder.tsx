'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Copy } from 'lucide-react'
import type { ScoringFormula } from '@/lib/types/database'

interface FormulaBuilderProps {
  formula?: ScoringFormula
  onSave: (formula: Partial<ScoringFormula>) => void
  onCancel: () => void
  operatorType?: 'weighted_avg' | 'custom'
}

interface Component {
  id: string
  name: string
  weight: number
  type: 'pillar' | 'dimension'
}

export function FormulaBuilder({
  formula,
  onSave,
  onCancel,
  operatorType = 'weighted_avg',
}: FormulaBuilderProps) {
  const [name, setName] = useState(formula?.name || '')
  const [description, setDescription] = useState(formula?.description || '')
  const [formulaType, setFormulaType] = useState(formula?.formula_type || 'overall')
  const [operator, setOperator] = useState(formula?.operator || 'weighted_avg')
  const [components, setComponents] = useState<Component[]>([])
  const [customExpression, setCustomExpression] = useState(formula?.formula_expression || '')
  const [newComponent, setNewComponent] = useState({ name: '', weight: 50, type: 'pillar' as const })

  // Generate preview formula
  const generatePreview = () => {
    if (operator === 'weighted_avg' && components.length > 0) {
      const totalWeight = components.reduce((sum, c) => sum + c.weight, 0)
      const parts = components.map((c) => `${c.name} (${Math.round((c.weight / totalWeight) * 100)}%)`)
      return parts.join(' + ')
    }
    if (operator === 'custom') {
      return customExpression
    }
    return `Using ${operator} operator`
  }

  const handleAddComponent = () => {
    if (newComponent.name) {
      setComponents([...components, { id: Date.now().toString(), ...newComponent }])
      setNewComponent({ name: '', weight: 50, type: 'pillar' })
    }
  }

  const handleRemoveComponent = (id: string) => {
    setComponents(components.filter((c) => c.id !== id))
  }

  const handleUpdateComponent = (id: string, weight: number) => {
    setComponents(components.map((c) => (c.id === id ? { ...c, weight } : c)))
  }

  const handleSave = () => {
    const formulaExpression =
      operator === 'weighted_avg'
        ? components.map((c) => c.name).join(' + ')
        : customExpression

    onSave({
      name,
      description,
      formula_type: formulaType,
      operator,
      formula_expression: formulaExpression,
    })
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Formula Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Formula Name</Label>
            <Input
              id="name"
              placeholder="e.g., Overall Assessment Score"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Describe how this formula is calculated"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="formula-type">Formula Type</Label>
              <select
                id="formula-type"
                value={formulaType}
                onChange={(e) => setFormulaType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="pillar">Pillar Score</option>
                <option value="dimension">Dimension Score</option>
                <option value="overall">Overall Score</option>
              </select>
            </div>

            <div>
              <Label htmlFor="operator">Operator</Label>
              <select
                id="operator"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="sum">Sum</option>
                <option value="avg">Average</option>
                <option value="weighted_avg">Weighted Average</option>
                <option value="min">Minimum</option>
                <option value="max">Maximum</option>
                <option value="custom">Custom Expression</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formula Builder */}
      {operator === 'weighted_avg' && (
        <Card>
          <CardHeader>
            <CardTitle>Component Weights</CardTitle>
            <CardDescription>Add pillars or dimensions and set their weights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Component */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="component-name" className="text-xs">
                    Component Name
                  </Label>
                  <Input
                    id="component-name"
                    placeholder="e.g., Pillar 1"
                    value={newComponent.name}
                    onChange={(e) =>
                      setNewComponent({ ...newComponent, name: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="component-weight" className="text-xs">
                    Weight (%)
                  </Label>
                  <Input
                    id="component-weight"
                    type="number"
                    min="0"
                    max="100"
                    value={newComponent.weight}
                    onChange={(e) =>
                      setNewComponent({
                        ...newComponent,
                        weight: parseInt(e.target.value) || 0,
                      })
                    }
                    className="text-sm"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleAddComponent}
                    size="sm"
                    className="w-full"
                  >
                    <Plus size={16} className="mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Components List */}
            {components.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>No components added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {components.map((component) => {
                  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0)
                  const percentage = Math.round((component.weight / totalWeight) * 100)

                  return (
                    <div
                      key={component.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{component.name}</p>
                        <p className="text-xs text-gray-600">
                          {component.type} • {percentage}% of total
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`weight-${component.id}`} className="text-xs">
                            Weight:
                          </Label>
                          <Input
                            id={`weight-${component.id}`}
                            type="number"
                            min="0"
                            max="100"
                            value={component.weight}
                            onChange={(e) =>
                              handleUpdateComponent(component.id, parseInt(e.target.value) || 0)
                            }
                            className="w-16 text-sm"
                          />
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveComponent(component.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Custom Expression */}
      {operator === 'custom' && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Expression</CardTitle>
            <CardDescription>
              Enter a JavaScript expression using variable names (e.g., pillar_1 + pillar_2 * 0.5)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={customExpression}
              onChange={(e) => setCustomExpression(e.target.value)}
              placeholder="e.g., (pillar_1 + pillar_2) / 2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              rows={4}
            />
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Formula Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-mono text-blue-900">{generatePreview()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex-1">
          <Copy size={16} className="mr-2" />
          Save Formula
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  )
}
