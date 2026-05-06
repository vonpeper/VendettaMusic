"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X, Phone, Calendar, Lock } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/#nosotros", label: "Nosotros" },
  { href: "/#servicios", label: "Servicios" },
  { href: "/#paquetes", label: "Paquetes" },
  { href: "/#fechas", label: "Fechas" },
  { href: "/#testimonios", label: "Testimoniales" },
  { href: "/#estatus", label: "Estatus" },
]

export function PublicNavbar() {
  return (
    <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-12 flex items-center">
            <img 
              src="/images/logo-vendetta-horizontal.png?v=4" 
              alt="Vendetta Logo" 
              className="h-full w-auto object-contain"
            />
          </div>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden lg:flex gap-8 items-center">
          {NAV_LINKS.map((link) => (
            <Link 
              key={link.label} 
              href={link.href} 
              className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-primary transition-all"
            >
              {link.label}
            </Link>
          ))}
          <div className="w-px h-4 bg-white/10 mx-2" />
          <Link href="/cotizar">
            <Button variant="default" className="font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl shadow-lg shadow-primary/20">
              Cotizar Evento
            </Button>
          </Link>
          <Link href="/auth/login" className="text-white/30 hover:text-primary transition-colors p-2" title="Admin Login">
            <Lock className="w-4 h-4" />
          </Link>
        </nav>

        {/* Mobile Nav Button */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger 
              render={
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" />
              }
            >
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#111] border-white/10 w-80 text-white p-0 overflow-hidden">
              <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
                <div className="p-6 border-b border-white/5">
                  <SheetHeader className="text-left mb-6">
                    <div className="h-12 flex items-center self-start">
                      <img 
                        src="/images/logo-vendetta-horizontal.png?v=4" 
                        alt="Vendetta Logo" 
                        className="h-full w-auto object-contain"
                      />
                    </div>
                    <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-1">
                    {NAV_LINKS.map((link) => (
                      <SheetClose 
                        key={link.label}
                        render={
                          <Link 
                            href={link.href} 
                            className="flex items-center py-4 text-sm font-black uppercase tracking-[0.2em] hover:text-primary transition-all border-b border-white/5 last:border-none"
                          />
                        }
                      >
                        {link.label}
                      </SheetClose>
                    ))}
                  </div>
                </div>
                
                <div className="p-6 mt-auto space-y-4">
                  <SheetClose 
                    render={
                      <Link href="/cotizar" className="block w-full" />
                    }
                  >
                    <Button variant="default" className="w-full py-6 font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20">
                      <Calendar className="w-4 h-4 mr-2" /> Cotizar mi Evento
                    </Button>
                  </SheetClose>
                  <a href="tel:5555555555" className="block w-full">
                    <Button variant="outline" className="w-full py-6 border-white/10 bg-white/5 text-white font-black text-xs uppercase tracking-widest rounded-2xl">
                      <Phone className="w-4 h-4 mr-2" /> Llamar Ahora
                    </Button>
                  </a>
                  <Link href="/auth/login" className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-primary transition-colors pt-4">
                    <Lock className="w-3 h-3" /> Login Admin
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
