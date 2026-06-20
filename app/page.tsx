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
              Comprehensive sustainable digitalization index evaluation. Admins manage formulas and matrices, while organizations calculate and track operational metrics.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Link href="/auth/signup">Get Started</Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </div>

          {/* Features Information Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle>Framework Console</CardTitle>
                <CardDescription>Structure index hierarchies</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Build custom versions of Industry 5.0 matrices dynamically. Wire questions directly into custom mathematical scoring formulas.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Survey Portal</CardTitle>
                <CardDescription>Calculate digital maturity</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Save response progress continuously. Gain immediate diagnostic scores upon submitting questionnaires.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hierarchical Recovery</CardTitle>
                <CardDescription>Bypass database data loss</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Maintain system continuity. Automatically capture and reassign disconnected metrics inside the Orphan Center.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}