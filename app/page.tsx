import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="mb-16 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl mb-4">
              Industry 5.0 Assessment Platform
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Comprehensive sustainable digitalization assessment framework. Admins configure assessments, respondents take surveys, and get actionable insights.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild size="lg">
                <Link href="/auth/signup">Get Started</Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle>Admin Console</CardTitle>
                <CardDescription>Full assessment control</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Create assessment versions, organize pillars and dimensions, design questions, and configure scoring formulas.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Survey Portal</CardTitle>
                <CardDescription>Respondent experience</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Take structured assessments with progress saving, submit responses, and receive instant scoring with maturity breakdown.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visual Formula Builder</CardTitle>
                <CardDescription>Flexible scoring logic</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag-and-drop formula builder for weighted averages, conditional logic, and custom scoring calculations.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Key Features */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle>Platform Features</CardTitle>
              <CardDescription>Everything you need to manage assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold mb-3">Admin Capabilities</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>✓ Create assessment versions</li>
                    <li>✓ Manage pillars, dimensions, questions</li>
                    <li>✓ Configure maturity levels (0-5)</li>
                    <li>✓ Build scoring formulas visually</li>
                    <li>✓ Handle orphaned data recovery</li>
                    <li>✓ View detailed respondent results</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Data Management</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>✓ Full CRUD on all elements</li>
                    <li>✓ Hierarchical data structure</li>
                    <li>✓ Role-based access control</li>
                    <li>✓ Progress saving for surveys</li>
                    <li>✓ Automatic score calculation</li>
                    <li>✓ Audit trail for changes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}

