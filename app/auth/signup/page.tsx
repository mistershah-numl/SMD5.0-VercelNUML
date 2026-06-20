'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [accountRole, setAccountRole] = useState<'respondent' | 'admin'>('respondent')
  const [adminSecretCode, setAdminSecretCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    // Strict validation check before triggering the network call
    let assignedRole = 'respondent'
    if (accountRole === 'admin') {
      if (adminSecretCode.trim() === 'SUPERSDM5') {
        assignedRole = 'admin'
      } else {
        setError('Invalid Admin Verification Code. Registration rejected.')
        setIsLoading(false)
        return
      }
    }

    try {
      // Force clear local storage entries to avoid crossover session identities
      localStorage.clear()
      sessionStorage.clear()

      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          // Explicitly pass string variable parameters to prevent default data bleeding
          data: {
            role: assignedRole,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) throw authError
      
      const messageText = assignedRole === 'admin'
        ? 'Admin account created! Please sign in.'
        : 'Company account created! Please sign in.'

      window.location.href = `/auth/login?message=${encodeURIComponent(messageText)}`
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create Account</CardTitle>
              <CardDescription>Sign up to start using the SDM5 Assessment Platform</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Register Account As</Label>
                  <Tabs 
                    defaultValue="respondent" 
                    className="w-full" 
                    onValueChange={(val) => setAccountRole(val as 'respondent' | 'admin')}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="respondent">Company</TabsTrigger>
                      <TabsTrigger value="admin">Platform Admin</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="repeatPassword">Confirm Password</Label>
                  <Input
                    id="repeatPassword"
                    type="password"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                  />
                </div>

                {accountRole === 'admin' && (
                  <div className="grid gap-2 p-3 bg-muted/40 rounded-lg border">
                    <Label htmlFor="adminCode" className="text-primary font-semibold">
                      Admin Verification Code
                    </Label>
                    <Input
                      id="adminCode"
                      type="password"
                      placeholder="Enter system secret authorization key"
                      required
                      value={adminSecretCode}
                      onChange={(e) => setAdminSecretCode(e.target.value)}
                    />
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <Link href="/auth/login" className="underline underline-offset-4 text-blue-600 hover:text-blue-800">
                  Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}