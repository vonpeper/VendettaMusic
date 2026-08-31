"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors w-full text-left"
    >
      <LogOut className="h-4 w-4" /> Cerrar Sesión
    </button>
  )
}
