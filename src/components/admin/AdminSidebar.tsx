"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, Calendar, Settings, LogOut, FileText, Music, 
  LayoutDashboard, TrendingUp, ShoppingBag, Image as LucideImage, 
  Truck, Mic, Shield, Bell, Inbox, ChevronDown, ChevronRight,
  BarChart3, Wallet, XCircle, BookOpen, History, MessageSquare, Menu
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface SidebarItem {
  name: string
  href: string
  icon: any
  adminOnly?: boolean
  badgeCount?: number
}

interface SidebarSection {
  title: string
  id: string
  icon: any
  items: SidebarItem[]
  placeholder?: boolean
}

interface AdminSidebarProps {
  user: {
    name?: string | null
    role?: string | null
  }
  pendingInbox?: number
}

export function AdminSidebar({ user, pendingInbox = 0 }: AdminSidebarProps) {
  const pathname = usePathname()
  const isAdmin = user.role === "ADMIN"

  const [mounted, setMounted] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ operacion: true, comms: true })

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("admin_sidebar_expanded")
    if (saved) {
      try {
        setExpandedSections(JSON.parse(saved))
      } catch (e) {
        console.error("Error parsing sidebar state", e)
      }
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("admin_sidebar_expanded", JSON.stringify(expandedSections))
    }
  }, [expandedSections, mounted])

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const sections: SidebarSection[] = [
    {
      title: "GESTIÓN",
      id: "operacion",
      icon: LayoutDashboard,
      items: [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Shows / Eventos", href: "/admin/eventos", icon: Calendar },
        { name: "Agenda de Ensayos", href: "/admin/ensayos", icon: Mic, adminOnly: true },
        { name: "Eventualidades", href: "/admin/eventualidades", icon: TrendingUp },
      ]
    },
    {
      title: "MENSAJERÍA",
      id: "comms",
      icon: Bell,
      items: [
        { name: "Bandeja de Entrada", href: "/admin/inbox", icon: Inbox },
        { name: "Log de mensajes", href: "/admin/inbox?tab=log", icon: History },
        { name: "Centro de Mensajería", href: "/admin/notificaciones", icon: MessageSquare, adminOnly: true },
      ]
    },
    {
      title: "CLIENTES",
      id: "crm",
      icon: Users,
      items: [
        { name: "Clientes", href: "/admin/clientes", icon: Users },
        { name: "Centro de Ventas", href: "/admin/ventas", icon: ShoppingBag },
        { name: "Testimoniales", href: "/admin/testimoniales", icon: FileText, adminOnly: true },
      ]
    },
    {
      title: "PRODUCCIÓN",
      id: "talento",
      icon: Music,
      items: [
        { name: "Banda y Suplentes", href: "/admin/banda", icon: Users, adminOnly: true },
        { name: "Repertorio", href: "/admin/repertorio", icon: Music, adminOnly: true },
      ]
    },
    {
      title: "OFERTA",
      id: "servicios",
      icon: ShoppingBag,
      items: [
        { name: "Catálogo de Paquetes", href: "/admin/paquetes", icon: ShoppingBag, adminOnly: true },
      ]
    },
    {
      title: "LOGÍSTICA",
      id: "logistica",
      icon: Truck,
      items: [
        { name: "Proveedores", href: "/admin/proveedores", icon: Truck },
      ]
    },
    {
      title: "AJUSTES",
      id: "configuracion",
      icon: Settings,
      items: [
        { name: "Diagnóstico", href: "/admin/diagnostico", icon: Settings, adminOnly: true },
        { name: "Administradores", href: "/admin/usuarios", icon: Shield, adminOnly: true },
        { name: "Configuración", href: "/admin/configuracion", icon: Settings, adminOnly: true },
      ]
    },
    {
      title: "MEDIA",
      id: "marketing",
      icon: LucideImage,
      items: [
        { name: "Banners & Galería", href: "/admin/media", icon: LucideImage, adminOnly: true },
      ]
    },
    {
      title: "AYUDA",
      id: "help",
      icon: BookOpen,
      items: [
        { name: "Documentación", href: "/admin/documentacion", icon: BookOpen },
      ]
    },
    {
      title: "FINANZAS",
      id: "finanzas",
      icon: Wallet,
      items: [
        { name: "Análisis Financiero", href: "/admin/finanzas", icon: Wallet, adminOnly: true }
      ]
    },
    {
      title: "MÉTRICAS",
      id: "analytics",
      icon: BarChart3,
      placeholder: true,
      items: []
    }
  ]

  // Removed !mounted return null so sidebar renders immediately during SSR

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border/40 px-4 flex items-center justify-between z-[40] shadow-sm">
        <button
          onClick={() => setExpandedSections(prev => ({ ...prev, mobile: !prev.mobile }))}
          className="p-2.5 rounded-xl bg-muted text-foreground hover:bg-muted/80 transition-all border border-border/40"
        >
          {expandedSections.mobile ? <XCircle className="w-5 h-5 text-destructive" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="h-8 flex items-center">
          <img 
            src="/images/logo-vendetta-horizontal.png?v=3" 
            alt="Vendetta Logo" 
            className="h-full w-auto object-contain"
          />
        </div>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/20">
          {user.name?.slice(0, 2).toUpperCase() || "AD"}
        </div>
      </div>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {expandedSections.mobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedSections(prev => ({ ...prev, mobile: false }))}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[50]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <aside className={cn(
        "bg-gradient-to-br from-[#3c3c3c] to-[#1a1a1a] flex flex-col rounded-2xl shadow-2xl overflow-hidden border-none shrink-0 transition-all duration-300 z-[55]",
        "fixed md:relative md:flex top-4 bottom-4 md:top-auto md:bottom-auto h-[calc(100vh-2rem)] md:h-auto",
        "w-64",
        expandedSections.mobile ? "left-4 opacity-100" : "-left-72 opacity-0 md:left-0 md:opacity-100"
      )}>
        {/* Header with Logo as requested */}
        <div className="p-8 flex flex-col items-center justify-center shrink-0 border-b border-white/5 bg-black/20">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-12 flex items-center">
              <img 
                src="/images/logo-vendetta-horizontal.png?v=3" 
                alt="Vendetta Logo" 
                className="h-full w-auto object-contain"
              />
            </div>
          </Link>
          <div className="mt-2 text-[9px] text-white/30 font-black uppercase tracking-[0.4em]">
            Panel de Control
          </div>
        </div>

        <div className="px-4 mb-4">
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 space-y-4 custom-scrollbar-white pb-6 touch-pan-y">
          {sections.map((section) => {
            const visibleItems = section.items.filter(item => !item.adminOnly || isAdmin)
            if (visibleItems.length === 0 && !section.placeholder) return null

            const isExpanded = expandedSections[section.id]
            const SectionIcon = section.icon
            const isAnyChildActive = visibleItems.some(item => pathname === item.href)

            return (
              <div key={section.id} className="space-y-1">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-3 text-[10px] font-black tracking-widest uppercase transition-all rounded-xl group mb-1",
                    isAnyChildActive 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30" 
                      : section.placeholder 
                        ? "text-white/20 cursor-not-allowed" 
                        : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                  disabled={section.placeholder}
                >
                  <div className="flex items-center gap-2">
                    <SectionIcon className={cn(
                      "w-4 h-4", 
                      isAnyChildActive ? "text-white" : (isExpanded ? "text-blue-500" : "text-blue-500/70 group-hover:text-blue-500")
                    )} />
                    {section.title}
                  </div>
                  {!section.placeholder && (
                    isExpanded 
                      ? <ChevronDown className={cn("w-3.5 h-3.5", isAnyChildActive ? "text-white/70" : "text-white/40")} /> 
                      : <ChevronRight className={cn("w-3.5 h-3.5", isAnyChildActive ? "text-white/70" : "text-white/40")} />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && !section.placeholder && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className={cn(
                        "space-y-1 mt-1 ml-1 pl-3 mb-2",
                        isAnyChildActive ? "border-l-2 border-blue-500/30" : "border-l border-white/10"
                      )}>
                        {visibleItems.map((item) => {
                          const Icon = item.icon
                          const isActive = pathname === item.href
                          
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setExpandedSections(prev => ({ ...prev, mobile: false }))}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all group relative",
                                isActive 
                                  ? "bg-white/10 text-white" 
                                  : "text-white/50 hover:text-white hover:bg-white/5"
                              )}
                            >
                                <Icon className={cn(
                                  "w-4 h-4 shrink-0 transition-transform",
                                  "text-white", // Always white as requested
                                  isActive ? "opacity-100 scale-110" : "opacity-40 group-hover:opacity-100 group-hover:scale-110"
                                )} />
                              <span className="flex-1 truncate uppercase tracking-tight">{item.name}</span>
                              {isActive && (
                                <motion.div 
                                  layoutId="activeSub"
                                  className="absolute left-0 w-1 h-4 bg-blue-500 rounded-full"
                                />
                              )}
                              {item.badgeCount ? (
                                <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-[10px] font-bold text-white">
                                  {item.badgeCount}
                                </span>
                              ) : null}
                            </Link>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 mt-auto">
          <Link 
            href="/" 
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/60 hover:text-white hover:bg-red-500/20 rounded-xl transition-all group"
          >
            <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> 
            <span>Regresar al Sitio</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
