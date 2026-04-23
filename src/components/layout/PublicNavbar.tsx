"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export function PublicNavbar() {
  return (
    <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Vendetta Logo" className="h-10 w-auto" />
        </Link>
        <nav className="hidden lg:flex gap-8 items-center">
          <Link href="/#nosotros" className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-primary transition-all">Nosotros</Link>
          <Link href="/#servicios" className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-primary transition-all">Servicios</Link>
          <Link href="/#paquetes" className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-primary transition-all">Paquetes</Link>
          <Link href="/#fechas" className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-primary transition-all">Fechas</Link>
          <Link href="/#testimonios" className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-primary transition-all">Testimoniales</Link>
          <div className="w-px h-4 bg-white/10 mx-2" />
          <Link href="/cotizar">
            <Button variant="default" className="font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl shadow-lg shadow-primary/20">
              Cotizar Evento
            </Button>
          </Link>
        </nav>
        <div className="md:hidden">
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  )
}
