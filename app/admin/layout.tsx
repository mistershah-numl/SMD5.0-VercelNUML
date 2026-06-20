'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/admin/sidebar'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear navigation state and force an absolute redirect to clean the session completely
      router.push('/auth/login')
      router.refresh()
    } catch (err) {
      console.error('Error signing out:', err)
      setIsLoggingOut(false)
    }
  }

  if (loading || isLoggingOut) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">
            {isLoggingOut ? 'Logging out...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-foreground">SDM5 Assessment Platform</h1>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.email}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
            >
              <LogOut size={16} />
              Logout
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  )
}