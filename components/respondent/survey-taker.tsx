'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronLeft, ChevronRight, Send } from 'lucide-react'

interface Question {
  id: string
  text: string
  question_type: string
  description?: string
  question_options?: Array<{ id: string; text: string; value: number }>
}

interface Dimension {
  id: string
  name: string
  questions: Question[]
}

interface Pillar {
  id: string
  name: string
  dimensions: Dimension[]
}

interface SurveyData {
  id: string
  name: string
  version: string
  pillars: Pillar[]
}

export function SurveyTaker({
  surveyId,
  surveyData,
  onSubmit,
  previousResponses = [],
}: {
  surveyId: string
  surveyData: SurveyData
  onSubmit: (responses: any[]) => void
  previousResponses?: Array<{ question_id: string; value: any; text_response?: string }>
}) {
  const [currentPillarIndex, setCurrentPillarIndex] = useState(0)
  const [currentDimensionIndex, setCurrentDimensionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  // Load previous responses if resuming survey
  useEffect(() => {
    const previousResponsesMap: Record<string, any> = {}
    previousResponses.forEach((resp) => {
      previousResponsesMap[resp.question_id] = resp.value || resp.text_response
    })
    setResponses(previousResponsesMap)
  }, [previousResponses])

  const currentPillar = surveyData.pillars[currentPillarIndex]
  const currentDimension = currentPillar.dimensions[currentDimensionIndex]
  const totalQuestions = surveyData.pillars.reduce(
    (sum, p) => sum + p.dimensions.reduce((dSum, d) => dSum + d.questions.length, 0),
    0
  )
  const answeredQuestions = Object.keys(responses).length
  const progress = (answeredQuestions / totalQuestions) * 100

  const handleAnswer = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }))

    // Auto-save the response
    saveResponse(questionId, value)
  }

  const saveResponse = async (questionId: string, value: any) => {
    try {
      await fetch('/api/respondent/question-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_response_id: surveyId,
          question_id: questionId,
          value: typeof value === 'number' ? value : null,
          text_response: typeof value === 'string' ? value : null,
        }),
      })
    } catch (error) {
      console.error('[v0] Error saving response:', error)
    }
  }

  const handleNext = () => {
    if (currentDimensionIndex < currentPillar.dimensions.length - 1) {
      setCurrentDimensionIndex(currentDimensionIndex + 1)
    } else if (currentPillarIndex < surveyData.pillars.length - 1) {
      setCurrentPillarIndex(currentPillarIndex + 1)
      setCurrentDimensionIndex(0)
    }
  }

  const handlePrevious = () => {
    if (currentDimensionIndex > 0) {
      setCurrentDimensionIndex(currentDimensionIndex - 1)
    } else if (currentPillarIndex > 0) {
      setCurrentPillarIndex(currentPillarIndex - 1)
      setCurrentDimensionIndex(
        surveyData.pillars[currentPillarIndex - 1].dimensions.length - 1
      )
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const responseList = Object.entries(responses).map(([questionId, value]) => ({
        question_id: questionId,
        value,
      }))

      await fetch(`/api/respondent/surveys/${surveyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })

      onSubmit(responseList)
    } catch (error) {
      console.error('[v0] Error submitting survey:', error)
    } finally {
      setLoading(false)
    }
  }

  const isLastQuestion =
    currentPillarIndex === surveyData.pillars.length - 1 &&
    currentDimensionIndex === currentPillar.dimensions.length - 1

  const renderQuestion = (question: Question) => {
    const value = responses[question.id]

    switch (question.question_type) {
      case 'single-choice':
        return (
          <RadioGroup value={String(value || '')} onValueChange={(val) => handleAnswer(question.id, parseInt(val))}>
            <div className="space-y-3">
              {question.question_options?.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={String(option.value)} id={option.id} />
                  <label htmlFor={option.id} className="text-sm font-medium cursor-pointer">
                    {option.text}
                  </label>
                </div>
              ))}
            </div>
          </RadioGroup>
        )

      case 'scale':
        return (
          <div className="space-y-3">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <Button
                  key={num}
                  variant={value === num ? 'default' : 'outline'}
                  onClick={() => handleAnswer(question.id, num)}
                  className="flex-1"
                >
                  {num}
                </Button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Strongly Disagree</span>
              <span>Strongly Agree</span>
            </div>
          </div>
        )

      case 'multi-choice':
        return (
          <div className="space-y-3">
            {question.question_options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={(value?.includes(option.value)) || false}
                  onCheckedChange={(checked) => {
                    const newValue = value || []
                    if (checked) {
                      handleAnswer(question.id, [...newValue, option.value])
                    } else {
                      handleAnswer(
                        question.id,
                        newValue.filter((v: number) => v !== option.value)
                      )
                    }
                  }}
                />
                <label htmlFor={option.id} className="text-sm font-medium cursor-pointer">
                  {option.text}
                </label>
              </div>
            ))}
          </div>
        )

      default:
        return (
          <textarea
            placeholder="Enter your response"
            value={value || ''}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={4}
          />
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>{surveyData.name}</CardTitle>
          <CardDescription>v{surveyData.version}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress: {answeredQuestions} of {totalQuestions} questions</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </CardContent>
      </Card>

      {/* Current Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentPillar.name}</CardTitle>
          <CardDescription>{currentDimension.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {currentDimension.questions.map((question, index) => (
              <div key={question.id} className="space-y-3 pb-6 border-b last:border-b-0 last:pb-0">
                <div>
                  <h4 className="font-medium">
                    {index + 1}. {question.text}
                  </h4>
                  {question.description && (
                    <p className="text-sm text-gray-600 mt-1">{question.description}</p>
                  )}
                </div>
                {renderQuestion(question)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between gap-2">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentPillarIndex === 0 && currentDimensionIndex === 0}
        >
          <ChevronLeft size={18} className="mr-2" />
          Previous
        </Button>

        {isLastQuestion ? (
          <Button onClick={handleSubmit} disabled={loading}>
            <Send size={18} className="mr-2" />
            {loading ? 'Submitting...' : 'Submit Survey'}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ChevronRight size={18} className="ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
