import Link from "next/link"
import { LogOut, Calendar, CreditCard, User, LayoutDashboard, FileText } from "lucide-react"

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/40 bg-card hidden md:flex flex-col">
        <div className="p-6 border-b border-border/40 flex flex-col justify-center gap-1">
          <span className="font-heading font-black text-xl tracking-wider uppercase text-white">Vendetta <span className="text-primary italic">Portal</span></span>
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Panel de Cliente</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/cliente" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors">
            <LayoutDashboard className="h-4 w-4" /> Resumen
          </Link>
          <Link href="/cliente/cotizar" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors">
            <FileText className="h-4 w-4" /> Cotizar Evento
          </Link>
          <Link href="/cliente/mis-eventos" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors">
            <Calendar className="h-4 w-4" /> Mis Eventos
          </Link>
          <Link href="/cliente/pagos" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors">
            <CreditCard className="h-4 w-4" /> Pagos y Saldo
          </Link>
          <Link href="/cliente/perfil" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors">
            <User className="h-4 w-4" /> Mi Perfil
          </Link>
        </nav>
        <div className="p-4 border-t border-border/40">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <LogOut className="h-4 w-4" /> Cerrar Sesión
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="h-16 border-b border-border/40 flex items-center px-6 bg-card/50 md:hidden">
            <span className="font-heading font-bold text-primary">PORTAL CLIENTE</span>
        </div>
        {children}
      </main>
    </div>
  )
}
