"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X, Phone, Calendar, Lock, Disc3 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"

const NAV_LINKS = [
  { href: "/#inicio", label: "Inicio" },
  { href: "/#paquetes", label: "Paquetes" },
  { href: "/#reproductor", label: "Reproductor", isButton: true },
  { href: "/#servicios", label: "Show" },
  { href: "/#nosotros", label: "La Banda" },
  { href: "/#fechas", label: "Fechas" },
  { href: "/#galeria", label: "Galería" },
  { href: "/#testimonios", label: "Opiniones" },
  { href: "/#estatus", label: "Estatus" },
]

export function PublicNavbar() {
  return (
    <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-[#07080D]/90 md:bg-[#07080D]/75 backdrop-blur-md shadow-[0_8px_32px_rgba(7,8,13,0.6)] transform-gpu">
      {/* Subtle glowing accent line at the top border */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF5A5F]/40 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group transition-transform duration-300 hover:scale-[1.02]">
          <div className="h-11 md:h-12 flex items-center relative">
            <Image 
              src="/images/logo-vendetta-horizontal.png" 
              alt="Vendetta Live Music" 
              width={199}
              height={48}
              priority
              sizes="199px"
              className="h-full w-auto object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
            />
          </div>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden lg:flex gap-4 xl:gap-6 items-center">
          {NAV_LINKS.map((link) => {
            if ((link as any).isButton) {
              return (
                <Link 
                  key={link.label} 
                  href={link.href} 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#20D5E5]/40 bg-[#20D5E5]/10 text-[#20D5E5] hover:bg-[#20D5E5]/20 hover:border-[#20D5E5]/70 hover:shadow-[0_0_14px_rgba(32,213,229,0.35)] text-xs font-semibold uppercase tracking-wider transition-all duration-300 whitespace-nowrap cursor-pointer"
                >
                  <Disc3 className="w-3.5 h-3.5 animate-spin" />
                  <span>{link.label}</span>
                </Link>
              )
            }
            return (
              <Link 
                key={link.label} 
                href={link.href} 
                className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-[#F2F0EB]/80 hover:text-[#FF5A5F] hover:drop-shadow-[0_0_8px_rgba(255,90,95,0.6)] transition-all whitespace-nowrap"
              >
                {link.label}
              </Link>
            )
          })}
          <div className="w-px h-4 bg-white/15 mx-1" />
          <Link href="/cotizar">
            <Button className="bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] hover:from-[#7e1032] hover:to-[#ff6d72] text-[#F2F0EB] font-sans font-semibold text-xs uppercase tracking-wider px-6 h-10 rounded-xl shadow-lg shadow-[#FF5A5F]/25 hover:shadow-[#FF5A5F]/40 hover:scale-[1.03] transition-all duration-300 border border-white/20 cursor-pointer">
              Cotizar
            </Button>
          </Link>
          <Link href="/auth/login" className="text-white/40 hover:text-[#FF5A5F] transition-colors p-2" title="Admin Login">
            <Lock className="w-4 h-4" />
          </Link>
        </nav>
 
        {/* Mobile Nav Button */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger 
              render={
                <Button variant="ghost" size="icon" className="text-[#F2F0EB] hover:bg-white/10 rounded-xl" />
              }
            >
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent side="right" className="bg-gradient-to-b from-[#07080D] via-[#15152B] to-[#42112D] border-l border-white/10 w-80 text-white p-0 overflow-hidden backdrop-blur-2xl">
              <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
                <div className="p-6 border-b border-white/10">
                  <SheetHeader className="text-left mb-6">
                    <div className="h-12 flex items-center self-start">
                      <Image 
                        src="/images/logo-vendetta-horizontal.png" 
                        alt="Vendetta Live Music" 
                        width={199}
                        height={48}
                        sizes="199px"
                        className="h-full w-auto object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
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
                            className={`flex items-center py-3.5 text-sm font-semibold uppercase tracking-[0.18em] transition-all border-b border-white/5 last:border-none ${
                              (link as any).isButton 
                                ? "text-[#20D5E5] hover:text-[#20D5E5]/80 font-bold" 
                                : "text-[#F2F0EB]/90 hover:text-[#FF5A5F]"
                            }`}
                          />
                        }
                      >
                        {(link as any).isButton ? (
                          <div className="flex items-center justify-between w-full">
                            <span className="flex items-center gap-2">
                              <Disc3 className="w-4 h-4 text-[#20D5E5] animate-spin" />
                              <span>{link.label}</span>
                            </span>
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#20D5E5]/20 text-[#20D5E5] font-bold border border-[#20D5E5]/30">
                              EN VIVO
                            </span>
                          </div>
                        ) : (
                          <span>{link.label}</span>
                        )}
                      </SheetClose>
                    ))}
                  </div>
                </div>
                
                <div className="p-6 mt-auto space-y-3">
                  <SheetClose 
                    render={
                      <Link href="/#reproductor" className="block w-full" />
                    }
                  >
                    <Button variant="outline" className="w-full py-5 border-[#20D5E5]/40 bg-[#20D5E5]/10 text-[#20D5E5] hover:bg-[#20D5E5]/20 font-semibold text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2">
                      <Disc3 className="w-4 h-4 animate-spin text-[#20D5E5]" /> Reproductor en Vivo
                    </Button>
                  </SheetClose>

                  <SheetClose 
                    render={
                      <Link href="/cotizar" className="block w-full" />
                    }
                  >
                    <Button variant="default" className="w-full py-6 font-semibold text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-[#FF5A5F]/20 bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-[#F2F0EB] border border-white/20">
                      <Calendar className="w-4 h-4 mr-2" /> Cotizar mi Evento
                    </Button>
                  </SheetClose>
                  {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (
                    <a 
                      href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER.replace(/\D/g, "")}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="block w-full"
                    >
                      <Button variant="outline" className="w-full py-6 border-white/15 bg-white/5 text-[#F2F0EB] font-semibold text-xs uppercase tracking-widest rounded-2xl hover:bg-white/10">
                        <Phone className="w-4 h-4 mr-2 text-[#FF5A5F]" /> WhatsApp Directo
                      </Button>
                    </a>
                  )}
                  <Link href="/auth/login" className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30 hover:text-[#FF5A5F] transition-colors pt-4">
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
