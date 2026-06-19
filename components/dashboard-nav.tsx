import Link from "next/link"
import { BarChart3, Users, Package, Settings, LayoutDashboard } from "lucide-react"

export function DashboardNav() {
  return (
    <div className="hidden border-r bg-background md:block md:w-64">
      <div className="flex h-full flex-col gap-2 p-4">
        <div className="flex h-12 items-center border-b px-4 font-semibold">
          <span>Navigation</span>
        </div>
        <nav className="grid gap-1 px-2 text-sm font-medium">
          <Link href="/" className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-primary">
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Users className="h-4 w-4" />
            <span>Customers</span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Package className="h-4 w-4" />
            <span>Products</span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </nav>
      </div>
    </div>
  )
}

