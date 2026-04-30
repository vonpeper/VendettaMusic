import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { UsersManager } from "@/components/admin/UsersManager"

export default async function AdminUsersPage() {
  const session = await auth()
  
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const admins = await db.user.findMany({
    where: {
      role: { in: ["ADMIN", "AGENTE"] }
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <UsersManager users={admins} currentUserId={session.user.id!} />
    </div>
  )
}
