"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, Calendar, Settings, LogOut, FileText, Music, 
  LayoutDashboard, TrendingUp, ShoppingBag, Image as LucideImage, 
  Truck, Mic, Shield, Inbox, ChevronDown, ChevronRight,
  BarChart3, Wallet, XCircle, BookOpen, MessageSquare, Menu
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
  badgeCount?: number
  badgeVariant?: "danger" | "warning" | "info" | "default"
}

interface SidebarSection {
  title: string
  id: string
  icon: React.ComponentType<{ className?: string }>
  items: SidebarItem[]
  placeholder?: boolean
}

interface AdminSidebarProps {
  user: {
    name?: string | null
    role?: string | null
  }
  pendingInbox?: number
  pendingLeads?: number
}

export function AdminSidebar({ user, pendingInbox = 0, pendingLeads = 0 }: AdminSidebarProps) {
  const pathname = usePathname()
  const isAdmin = user.role === "ADMIN"

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin_sidebar_expanded_v3")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          // Ignore parse errors
        }
      }
    }
    return { comercial: true, operaciones: true, configuracion: false }
  })

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = { ...prev, [id]: !prev[id] }
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("admin_sidebar_expanded_v3", JSON.stringify(next))
        } catch {
          // Ignore storage errors
        }
      }
      return next
    })
  }

  const sections: SidebarSection[] = [
    {
      title: "COMERCIAL",
      id: "comercial",
      icon: ShoppingBag,
      items: [
        { 
          name: "Ventas & Leads", 
          href: "/admin/ventas", 
          icon: ShoppingBag, 
          badgeCount: pendingLeads, 
          badgeVariant: "danger" 
        },
        { 
          name: "Bandeja WhatsApp", 
          href: "/admin/inbox", 
          icon: Inbox, 
          badgeCount: pendingInbox, 
          badgeVariant: "info" 
        },
        { 
          name: "Clientes", 
          href: "/admin/clientes", 
          icon: Users 
        },
        { 
          name: "Análisis Financiero", 
          href: "/admin/finanzas", 
          icon: Wallet, 
          adminOnly: true 
        },
        { 
          name: "Centro de Notificaciones", 
          href: "/admin/notificaciones", 
          icon: MessageSquare, 
          adminOnly: true 
        },
        { 
          name: "Testimoniales", 
          href: "/admin/testimoniales", 
          icon: FileText, 
          adminOnly: true 
        },
      ]
    },
    {
      title: "OPERACIONES",
      id: "operaciones",
      icon: Calendar,
      items: [
        { 
          name: "Agenda & Shows", 
          href: "/admin/eventos", 
          icon: Calendar 
        },
        { 
          name: "Calendario General", 
          href: "/agenda", 
          icon: Calendar 
        },
        { 
          name: "Músicos & Staff", 
          href: "/admin/banda", 
          icon: Users, 
          adminOnly: true 
        },
        { 
          name: "Repertorio", 
          href: "/admin/repertorio", 
          icon: Music, 
          adminOnly: true 
        },
        { 
          name: "Agenda de Ensayos", 
          href: "/admin/ensayos", 
          icon: Mic, 
          adminOnly: true 
        },
        { 
          name: "Eventualidades", 
          href: "/admin/eventualidades", 
          icon: TrendingUp 
        },
      ]
    },
    {
      title: "CONFIGURACIÓN",
      id: "configuracion",
      icon: Settings,
      items: [
        { 
          name: "Ajustes & Tarifas", 
          href: "/admin/configuracion", 
          icon: Settings, 
          adminOnly: true 
        },
        { 
          name: "Catálogo de Paquetes", 
          href: "/admin/paquetes", 
          icon: ShoppingBag, 
          adminOnly: true 
        },
        { 
          name: "Proveedores", 
          href: "/admin/proveedores", 
          icon: Truck 
        },
        { 
          name: "Administradores", 
          href: "/admin/usuarios", 
          icon: Shield, 
          adminOnly: true 
        },
        { 
          name: "Banners & Galería", 
          href: "/admin/media", 
          icon: LucideImage, 
          adminOnly: true 
        },
        { 
          name: "Diagnóstico", 
          href: "/admin/diagnostico", 
          icon: Settings, 
          adminOnly: true 
        },
        { 
          name: "Métricas & SEO", 
          href: "/admin/analytics", 
          icon: BarChart3, 
          adminOnly: true 
        },
        { 
          name: "Documentación", 
          href: "/admin/documentacion", 
          icon: BookOpen 
        },
      ]
    }
  ]

  // Auto-expand section if active child route matches
  useEffect(() => {
    sections.forEach(section => {
      const hasActiveChild = section.items.some(item => {
        if (item.href === "/admin") return pathname === "/admin"
        return pathname === item.href || pathname.startsWith(item.href + "/")
      })
      if (hasActiveChild && !expandedSections[section.id]) {
        setExpandedSections(prev => {
          const next = { ...prev, [section.id]: true }
          try {
            localStorage.setItem("admin_sidebar_expanded_v3", JSON.stringify(next))
          } catch {}
          return next
        })
      }
    })
  }, [pathname])

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
        "bg-gradient-to-br from-[#3c3c3c] to-[#1a1a1a] flex flex-col rounded-2xl shadow-2xl overflow-hidden border-none shrink-0 transition-all duration-300 z-[55] md:z-10",
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
        <nav className="flex-1 overflow-y-auto px-4 space-y-3 custom-scrollbar-white pb-6 touch-pan-y">
          {/* Quick Dashboard Action */}
          <div className="mb-2">
            <Link
              href="/admin"
              onClick={() => setExpandedSections(prev => ({ ...prev, mobile: false }))}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all group relative",
                pathname === "/admin"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              )}
            >
              <LayoutDashboard className={cn(
                "w-4 h-4 transition-transform",
                pathname === "/admin" ? "text-white scale-110" : "text-blue-400 group-hover:text-blue-300 group-hover:scale-110"
              )} />
              <span className="flex-1 uppercase tracking-tight text-[11px] font-black">Dashboard</span>
              {pathname === "/admin" && (
                <motion.div 
                  layoutId="activeSub"
                  className="absolute left-0 w-1 h-4 bg-white rounded-full"
                />
              )}
            </Link>
          </div>

          {/* 3 Collapsible Blocks */}
          {sections.map((section) => {
            const visibleItems = section.items.filter(item => !item.adminOnly || isAdmin)
            if (visibleItems.length === 0 && !section.placeholder) return null

            const isExpanded = expandedSections[section.id]
            const SectionIcon = section.icon
            const isAnyChildActive = visibleItems.some(item => 
              item.href === "/admin" ? pathname === "/admin" : (pathname === item.href || pathname.startsWith(item.href + "/"))
            )
            const sectionBadgeCount = visibleItems.reduce((acc, it) => acc + (it.badgeCount || 0), 0)

            return (
              <div key={section.id} className="space-y-1">
                {/* Section Header Accordion Button */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-[10px] font-black tracking-widest uppercase transition-all rounded-xl group",
                    isAnyChildActive 
                      ? "bg-white/10 text-white border border-white/10" 
                      : section.placeholder 
                        ? "text-white/20 cursor-not-allowed" 
                        : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                  disabled={section.placeholder}
                >
                  <div className="flex items-center gap-2">
                    <SectionIcon className={cn(
                      "w-3.5 h-3.5 transition-colors", 
                      isAnyChildActive ? "text-blue-400" : (isExpanded ? "text-blue-400/90" : "text-blue-500/70 group-hover:text-blue-400")
                    )} />
                    <span className="tracking-wider">{section.title}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {!isExpanded && sectionBadgeCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-[9px] font-black text-white shadow-sm shadow-red-600/40 animate-pulse">
                        {sectionBadgeCount}
                      </span>
                    )}
                    {!section.placeholder && (
                      isExpanded 
                        ? <ChevronDown className={cn("w-3.5 h-3.5", isAnyChildActive ? "text-white/80" : "text-white/40")} /> 
                        : <ChevronRight className={cn("w-3.5 h-3.5", isAnyChildActive ? "text-white/80" : "text-white/40")} />
                    )}
                  </div>
                </button>

                {/* Section Sub-items */}
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
                        "space-y-1 mt-1 ml-1 pl-2.5 mb-2",
                        isAnyChildActive ? "border-l-2 border-blue-500/40" : "border-l border-white/10"
                      )}>
                        {visibleItems.map((item) => {
                          const Icon = item.icon
                          const isActive = item.href === "/admin" 
                            ? pathname === "/admin" 
                            : (pathname === item.href || pathname.startsWith(item.href + "/"))
                          
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setExpandedSections(prev => ({ ...prev, mobile: false }))}
                              className={cn(
                                "flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all group relative",
                                isActive 
                                  ? "bg-white/15 text-white shadow-sm font-bold" 
                                  : "text-white/60 hover:text-white hover:bg-white/5"
                              )}
                            >
                              <Icon className={cn(
                                "w-4 h-4 shrink-0 transition-transform text-white",
                                isActive ? "opacity-100 scale-110" : "opacity-45 group-hover:opacity-100 group-hover:scale-110"
                              )} />
                              <span className="flex-1 truncate tracking-tight">{item.name}</span>
                              
                              {isActive && (
                                <motion.div 
                                  layoutId="activeSub"
                                  className="absolute left-0 w-1 h-3.5 bg-blue-500 rounded-full"
                                />
                              )}

                              {item.badgeCount && item.badgeCount > 0 ? (
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 tracking-tight shadow-sm",
                                  item.badgeVariant === "danger"
                                    ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-red-600/30 animate-pulse"
                                    : item.badgeVariant === "warning"
                                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-amber-500/30 font-black"
                                      : item.badgeVariant === "info"
                                        ? "bg-emerald-600 text-white shadow-emerald-600/30"
                                        : "bg-blue-600 text-white"
                                )}>
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
