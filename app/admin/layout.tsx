'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/admin/sidebar'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkRoleAccessGuard = async () => {
      // Force direct connection request bypass to authentication endpoints
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        window.location.replace('/auth/login')
        return
      }

      const userRole = user.user_metadata?.role
      const isSuperAdminEmail = user.email === 'numl-s22-10226@numls.edu.pk'

      // STRICT ROLE VALIDATION SECURITY CHECK
      if (userRole === 'admin' || isSuperAdminEmail) {
        setUser(user)
        setLoading(false)
      } else {
        // Explicitly force user to Respondent panel if they lack Admin credentials
        window.location.replace('/respondent')
      }
    }

    checkRoleAccessGuard()
  }, [supabase])

  const handleLogout = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut({ scope: 'global' })
      localStorage.clear()
      sessionStorage.clear()
      window.location.replace('/auth/login')
    } catch (err) {
      console.error('Error signing out:', err)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Authorizing workspace access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-foreground">SDM5 Assessment Admin Console</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-md border">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-destructive hover:bg-destructive/10 border-destructive/20 gap-2">
              <LogOut size={16} /> Logout
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  )
}