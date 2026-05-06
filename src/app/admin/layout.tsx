import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) {
    redirect("/auth/login")
  }

  const isAdmin = session.user?.role === "ADMIN"
  const isAgent = session.user?.role === "AGENTE"

  if (!isAdmin && !isAgent) {
    redirect("/")
  }

  const config = await (db as any).globalConfig?.findUnique({ where: { id: "vendetta_config" } }).catch(() => null)
  const pendingInbox = await (db as any).inboxItem?.count?.({ where: { status: "pending" } }).catch(() => 0) || 0

  return (
    <div className="admin-theme flex min-h-screen bg-background text-foreground p-4 gap-4">
      {/* Sidebar - Floating style */}
      <AdminSidebar 
        user={{ name: session.user?.name, role: session.user?.role }} 
        pendingInbox={pendingInbox} 
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto rounded-3xl bg-transparent">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
