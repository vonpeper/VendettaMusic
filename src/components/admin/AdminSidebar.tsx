"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, Calendar, Settings, LogOut, FileText, Music, 
  LayoutDashboard, TrendingUp, ShoppingBag, Image as LucideImage, 
  Truck, Mic, Shield, Bell, Inbox, ChevronDown, ChevronRight,
  BarChart3, Wallet, XCircle
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ operacion: true })

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
      title: "MENSAJES",
      id: "comunicacion",
      icon: Bell,
      items: [
        { name: "Notificaciones", href: "/admin/notificaciones", icon: Bell },
        { name: "Bandeja Atención", href: "/admin/inbox", icon: Inbox, badgeCount: pendingInbox },
      ]
    },
    {
      title: "AJUSTES",
      id: "configuracion",
      icon: Settings,
      items: [
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
      title: "FINANZAS",
      id: "finanzas",
      icon: Wallet,
      placeholder: true,
      items: []
    },
    {
      title: "MÉTRICAS",
      id: "analytics",
      icon: BarChart3,
      placeholder: true,
      items: []
    }
  ]

  if (!mounted) return null

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed top-4 left-4 z-[60]">
        <button
          onClick={() => setExpandedSections(prev => ({ ...prev, mobile: !prev.mobile }))}
          className="p-3 rounded-xl bg-gradient-to-br from-[#3c3c3c] to-[#1a1a1a] text-white shadow-xl border border-white/10"
        >
          {expandedSections.mobile ? <XCircle className="w-6 h-6" /> : <Inbox className="w-6 h-6" />}
        </button>
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
        "fixed md:relative md:flex h-[calc(100vh-2rem)]",
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

            return (
              <div key={section.id} className="space-y-1">
                <button
                  onClick={() => toggleSection(section.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-[10px] font-black tracking-widest uppercase transition-all rounded-lg group",
                    section.placeholder 
                      ? "text-white/20 cursor-not-allowed" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                  disabled={section.placeholder}
                >
                  <div className="flex items-center gap-2">
                    <SectionIcon className={cn("w-3.5 h-3.5", isExpanded ? "text-primary" : "text-primary/60 group-hover:text-primary")} />
                    {section.title}
                  </div>
                  {!section.placeholder && (
                    isExpanded ? <ChevronDown className="w-3 h-3 text-white/40" /> : <ChevronRight className="w-3 h-3 text-white/40" />
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
                      <div className="space-y-1.5 mt-1">
                        {visibleItems.map((item) => {
                          const Icon = item.icon
                          const isActive = pathname === item.href
                          
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setExpandedSections(prev => ({ ...prev, mobile: false }))}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all group relative",
                                isActive 
                                  ? "bg-gradient-to-r from-[#E91E63] to-[#D81B60] text-white shadow-lg shadow-pink-500/30" 
                                  : "text-white/70 hover:text-white hover:bg-white/5"
                              )}
                            >
                              <Icon className={cn(
                                "w-5 h-5 shrink-0 transition-transform",
                                isActive ? "text-white" : "text-white/50 group-hover:text-white/90"
                              )} />
                              <span className="flex-1 truncate">{item.name}</span>
                              {item.badgeCount ? (
                                <span className="px-1.5 py-0.5 rounded-full bg-white text-[10px] font-bold text-pink-600">
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
