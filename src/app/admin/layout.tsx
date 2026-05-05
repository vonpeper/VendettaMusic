import Link from "next/link"
import Image from "next/image"
import { Users, Calendar, Settings, LogOut, FileText, Music, LayoutDashboard, TrendingUp, ShoppingBag, Image as ImageIcon, Truck, Mic, Shield, Bell } from "lucide-react"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"

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
      <aside className="w-64 border-r border-border/40 bg-card hidden md:flex flex-col">
        <div className="p-6 border-b border-border/40 flex items-center gap-3">
          <div className="w-8 h-8 relative shrink-0">
            <Image 
              src="/logo.png" 
              alt="Vendetta Logo" 
              fill
              className="object-contain"
            />
          </div>
          <span className="font-heading font-black text-xl text-primary tracking-wider uppercase truncate">
            {session.user?.name || (isAdmin ? "Admin" : "Agente")}
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-foreground rounded-lg hover:bg-primary/5 transition-all border-b border-border/5 mb-1 group">
            <LayoutDashboard className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" /> Dashboard
          </Link>
          <Link href="/admin/clientes" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-foreground rounded-lg hover:bg-primary/5 transition-all border-b border-border/5 mb-1 group">
            <Users className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" /> Clientes
          </Link>
          <Link href="/admin/eventos" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-foreground rounded-lg hover:bg-primary/5 transition-all border-b border-border/5 mb-1 group">
            <Calendar className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" /> Shows / Eventos
          </Link>
          
          {/* NUEVO: Bandeja de Atención */}
          <Link href="/admin/inbox" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-foreground rounded-lg hover:bg-primary/5 transition-all border-b border-border/5 mb-1 group relative">
            <Inbox className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
            <span className="flex-1">Bandeja Atención</span>
            {pendingInbox > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                {pendingInbox}
              </span>
            )}
          </Link>

          <Link href="/admin/eventualidades" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-foreground rounded-lg hover:bg-primary/5 transition-all border-b border-border/5 mb-1 group">
            <TrendingUp className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" /> Eventualidades
          </Link>
          
          {isAdmin && (
            <>
              <Link href="/admin/banda" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-foreground rounded-lg hover:bg-primary/5 transition-all border-b border-border/5 mb-1 group">
                <Users className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" /> Banda y Suplentes
              </Link>
              <Link href="/admin/ensayos" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-foreground rounded-lg hover:bg-primary/5 transition-all border-b border-border/5 mb-1 group">
                <Mic className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" /> Agenda de Ensayos
              </Link>
            </>
          )}

          <Link href="/admin/proveedores" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-foreground rounded-lg hover:bg-primary/5 transition-all border-b border-border/5 mb-1 group">
            <Truck className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" /> Proveedores
          </Link>
          <Link href="/admin/ventas" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-foreground rounded-lg hover:bg-primary/5 transition-all border-b border-border/5 mb-1 group">
            <ShoppingBag className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" /> Centro de Ventas
          </Link>

          {/* NUEVO: Log de WhatsApp */}
          <Link href="/admin/notificaciones" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-foreground rounded-lg hover:bg-primary/5 transition-all border-b border-border/5 mb-1 group">
            <Bell className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
            <span className="flex-1">Log de WhatsApp</span>
          </Link>

          {isAdmin && (
            <>
              <Link href="/admin/repertorio" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-foreground rounded-lg hover:bg-primary/5 transition-all border-b border-border/5 mb-1 group">
                <Music className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" /> Repertorio
              </Link>
              <Link href="/admin/paquetes" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-foreground rounded-lg hover:bg-primary/5 transition-all border-b border-border/5 mb-1 group">
                <ShoppingBag className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" /> Catálogo de Paquetes
              </Link>
              <Link href="/admin/usuarios" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-foreground rounded-lg hover:bg-primary/5 transition-all border-b border-border/5 mb-1 group">
                <Shield className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" /> Administradores
              </Link>
              <Link href="/admin/configuracion" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-foreground rounded-lg hover:bg-primary/5 transition-all border-t border-border/20 pt-4 mt-4 border-b border-border/5 mb-1 group">
                <Settings className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" /> Configuración
              </Link>
              <Link href="/admin/media" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-foreground rounded-lg hover:bg-primary/5 transition-all border-b border-border/5 mb-1 group">
                <ImageIcon className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" /> Banners & Galería
              </Link>
              <Link href="/admin/testimoniales" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-foreground rounded-lg hover:bg-primary/5 transition-all group border-b border-border/5 mb-1">
                <FileText className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" /> Testimoniales
              </Link>
            </>
          )}

        </nav>
        <div className="p-4 border-t border-border/40">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <LogOut className="h-4 w-4" /> Salir al sitio
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
