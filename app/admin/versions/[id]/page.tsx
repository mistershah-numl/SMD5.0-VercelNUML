'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import Link from 'next/link'
import { ArrowLeft, PlusCircle, Trash2, Edit2, Loader2 } from 'lucide-react'
import { DimensionForm } from '@/components/admin/dimension-form'
import { QuestionForm } from '@/components/admin/question-form'
import type { IndexVersion, Pillar, Dimension, Question } from '@/lib/types/database'

export default function VersionDetailPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const versionId = params.id as string

  const [version, setVersion] = useState<IndexVersion | null>(null)
  const [pillars, setPillars] = useState<Pillar[]>([])
  const [dimensions, setDimensions] = useState<Dimension[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pillars')

  // Form states
  const [showPillarDialog, setShowPillarDialog] = useState(false)
  const [pillarForm, setPillarForm] = useState({ name: '', description: '', weight: 1 })
  const [deletingPillar, setDeletingPillar] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [versionId])

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Fetch version
      const { data: versionData } = await supabase
        .from('index_versions')
        .select('*')
        .eq('id', versionId)
        .eq('created_by', user.id)
        .single()

      if (!versionData) {
        router.push('/admin/versions')
        return
      }

      setVersion(versionData)

      // Fetch pillars
      const { data: pillarsData } = await supabase
        .from('pillars')
        .select('*')
        .eq('index_version_id', versionId)
        .eq('status', 'active')
        .order('order_index', { ascending: true })

      setPillars(pillarsData || [])

      // Fetch dimensions
      const { data: dimensionsData } = await supabase
        .from('dimensions')
        .select('*')
        .eq('index_version_id', versionId)
        .eq('status', 'active')
        .order('order_index', { ascending: true })

      setDimensions(dimensionsData || [])

      // Fetch questions
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('index_version_id', versionId)
        .eq('status', 'active')
        .order('order_index', { ascending: true })

      setQuestions(questionsData || [])

      setLoading(false)
    } catch (error) {
      console.error('[v0] Error fetching data:', error)
      setLoading(false)
    }
  }

  const handleCreatePillar = async () => {
    if (!version || !pillarForm.name) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('pillars')
        .insert([
          {
            index_version_id: version.id,
            name: pillarForm.name,
            description: pillarForm.description || null,
            weight: pillarForm.weight,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error

      setPillars([...pillars, data])
      setShowPillarDialog(false)
      setPillarForm({ name: '', description: '', weight: 1 })
    } catch (error) {
      console.error('[v0] Error creating pillar:', error)
    }
  }

  const handleDeletePillar = async (pillarId: string) => {
    if (!confirm('Delete this pillar? Associated dimensions will become orphaned.')) return

    try {
      setDeletingPillar(pillarId)
      const { error } = await supabase
        .from('pillars')
        .delete()
        .eq('id', pillarId)

      if (error) throw error

      setPillars(pillars.filter((p) => p.id !== pillarId))
    } catch (error) {
      console.error('[v0] Error deleting pillar:', error)
    } finally {
      setDeletingPillar(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading version...</p>
        </div>
      </div>
    )
  }

  if (!version) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Version not found</p>
        <Button asChild className="mt-4">
          <Link href="/admin/versions">Back to Versions</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/versions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{version.name}</h1>
          <p className="text-muted-foreground mt-1">v{version.version}</p>
        </div>
      </div>

      {/* Version Details */}
      <Card>
        <CardHeader>
          <CardTitle>Version Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="font-semibold">{version.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Version</label>
              <p className="font-semibold">v{version.version}</p>
            </div>
            {version.description && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-foreground">{version.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for managing structure */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="pillars">
            Pillars ({pillars.length})
          </TabsTrigger>
          <TabsTrigger value="dimensions">
            Dimensions ({dimensions.length})
          </TabsTrigger>
          <TabsTrigger value="questions">
            Questions ({questions.length})
          </TabsTrigger>
        </TabsList>

        {/* Pillars Tab */}
        <TabsContent value="pillars" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Manage Pillars</h2>
            <Dialog open={showPillarDialog} onOpenChange={setShowPillarDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Pillar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Pillar</DialogTitle>
                  <DialogDescription>
                    Add a new pillar to this assessment version
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={pillarForm.name}
                      onChange={(e) => setPillarForm({ ...pillarForm, name: e.target.value })}
                      placeholder="e.g., Strategic Management"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={pillarForm.description}
                      onChange={(e) => setPillarForm({ ...pillarForm, description: e.target.value })}
                      placeholder="Describe this pillar..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Weight</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={pillarForm.weight}
                      onChange={(e) => setPillarForm({ ...pillarForm, weight: parseFloat(e.target.value) })}
                    />
                  </div>
                  <Button onClick={handleCreatePillar} className="w-full">
                    Create Pillar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {pillars.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No pillars yet. Create your first pillar to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pillars.map((pillar) => (
                <Card key={pillar.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{pillar.name}</CardTitle>
                        {pillar.description && <CardDescription>{pillar.description}</CardDescription>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeletePillar(pillar.id)}
                          disabled={deletingPillar === pillar.id}
                        >
                          {deletingPillar === pillar.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Weight: {pillar.weight}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(pillar.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Dimensions Tab */}
        <TabsContent value="dimensions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Manage Dimensions</h2>
            <DimensionForm
              versionId={versionId}
              pillars={pillars}
              onDimensionCreated={fetchData}
            />
          </div>
          {dimensions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No dimensions yet. Create your first dimension to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {dimensions.map((dimension) => (
                <Card key={dimension.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{dimension.name}</CardTitle>
                        {dimension.description && (
                          <CardDescription className="mt-1">
                            {dimension.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Weight: {dimension.weight}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(dimension.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Manage Questions</h2>
            <QuestionForm
              versionId={versionId}
              dimensions={dimensions}
              onQuestionCreated={fetchData}
            />
          </div>
          {questions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No questions yet. Create your first question to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {questions.map((question) => (
                <Card key={question.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{question.text}</CardTitle>
                        <CardDescription className="mt-1">
                          Type: {question.question_type} • Weight: {question.weight}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
