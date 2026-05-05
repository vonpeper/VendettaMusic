import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) {
    redirect("/auth/login")
  }

  const isAdmin = session.user?.role === "ADMIN"

  const pendingInbox = await db.inboxItem.count({
    where: { status: "pending" },
  }).catch(() => 0)

  return (
    <div className="admin-theme flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <AdminSidebar 
        user={{ name: session.user?.name, role: session.user?.role }} 
        pendingInbox={pendingInbox} 
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
