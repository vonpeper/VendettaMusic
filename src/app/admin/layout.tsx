import Link from "next/link"
import { Shield, Users, Calendar, Settings, LogOut, FileText, Music, LayoutDashboard, TrendingUp, ShoppingBag, Image as ImageIcon, Truck, Mic } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/40 bg-card hidden md:flex flex-col">
        <div className="p-6 border-b border-border/40 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-heading font-black text-xl text-primary tracking-wider uppercase">Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link href="/admin/clientes" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors">
            <Users className="h-4 w-4" /> Clientes
          </Link>
          <Link href="/admin/eventos" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors">
            <Calendar className="h-4 w-4" /> Shows / Eventos
          </Link>
          <Link href="/admin/banda" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors">
            <Users className="h-4 w-4" /> Banda y Suplentes
          </Link>
          <Link href="/admin/ensayos" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors">
            <Mic className="h-4 w-4" /> Agenda de Ensayos
          </Link>
          <Link href="/admin/eventualidades" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors">
            <TrendingUp className="h-4 w-4" /> Eventualidades
          </Link>
          <Link href="/admin/proveedores" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors">
            <Truck className="h-4 w-4" /> Proveedores
          </Link>
          <Link href="/admin/ventas" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors">
            <ShoppingBag className="h-4 w-4" /> Centro de Ventas
          </Link>
          <Link href="/admin/repertorio" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors">
            <Music className="h-4 w-4" /> Repertorio
          </Link>
          <Link href="/admin/configuracion" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors border-t border-border/20 pt-4 mt-4">
            <Settings className="h-4 w-4" /> Configuración
          </Link>
          <Link href="/admin/media" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors">
            <ImageIcon className="h-4 w-4" /> Banners & Galería
          </Link>
          <Link href="/admin/testimoniales" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors">
            <FileText className="h-4 w-4" /> Testimoniales
          </Link>
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
