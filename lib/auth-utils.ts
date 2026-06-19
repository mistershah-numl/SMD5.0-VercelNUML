import { createClient } from '@/lib/supabase/server'

export type UserRole = 'admin' | 'respondent'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  user_metadata?: Record<string, any>
}

/**
 * Get the current authenticated user with role information
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return {
    id: user.id,
    email: user.email || '',
    role: (user.user_metadata?.role as UserRole) || 'respondent',
    user_metadata: user.user_metadata,
  }
}

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string, role: UserRole = 'respondent') {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      data: {
        role,
      },
    },
  })

  return { data, error }
}

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'admin' ?? false
}

/**
 * Protect admin routes
 */
export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }
  return user
}
