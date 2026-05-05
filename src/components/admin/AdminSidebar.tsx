"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, Calendar, Settings, LogOut, FileText, Music, 
  LayoutDashboard, TrendingUp, ShoppingBag, Image as ImageIcon, 
  Truck, Mic, Shield, Bell, Inbox, ChevronDown, ChevronRight,
  BarChart3, Wallet
} from "lucide-react"
import { cn } from "@/lib/utils"

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

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin_sidebar_expanded")
      return saved ? JSON.parse(saved) : { operacion: true }
    }
    return { operacion: true }
  })

  useEffect(() => {
    localStorage.setItem("admin_sidebar_expanded", JSON.stringify(expandedSections))
  }, [expandedSections])

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const sections: SidebarSection[] = [
    {
      title: "OPERACIÓN",
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
      title: "CRM & CLIENTES",
      id: "crm",
      icon: Users,
      items: [
        { name: "Clientes", href: "/admin/clientes", icon: Users },
        { name: "Centro de Ventas", href: "/admin/ventas", icon: ShoppingBag },
        { name: "Testimoniales", href: "/admin/testimoniales", icon: FileText, adminOnly: true },
      ]
    },
    {
      title: "TALENTO & PRODUCCIÓN",
      id: "talento",
      icon: Music,
      items: [
        { name: "Banda y Suplentes", href: "/admin/banda", icon: Users, adminOnly: true },
        { name: "Repertorio", href: "/admin/repertorio", icon: Music, adminOnly: true },
      ]
    },
    {
      title: "SERVICIOS & OFERTA",
      id: "servicios",
      icon: ShoppingBag,
      items: [
        { name: "Catálogo de Paquetes", href: "/admin/paquetes", icon: ShoppingBag, adminOnly: true },
      ]
    },
    {
      title: "PROVEEDORES & LOGÍSTICA",
      id: "logistica",
      icon: Truck,
      items: [
        { name: "Proveedores", href: "/admin/proveedores", icon: Truck },
      ]
    },
    {
      title: "COMUNICACIÓN",
      id: "comunicacion",
      icon: Bell,
      items: [
        { name: "Notificaciones", href: "/admin/notificaciones", icon: Bell },
        { name: "Bandeja Atención", href: "/admin/inbox", icon: Inbox, badgeCount: pendingInbox },
      ]
    },
    {
      title: "CONFIGURACIÓN",
      id: "configuracion",
      icon: Settings,
      items: [
        { name: "Administradores", href: "/admin/usuarios", icon: Shield, adminOnly: true },
        { name: "Configuración", href: "/admin/configuracion", icon: Settings, adminOnly: true },
      ]
    },
    {
      title: "CONTENIDO & MARKETING",
      id: "marketing",
      icon: ImageIcon,
      items: [
        { name: "Banners & Galería", href: "/admin/media", icon: ImageIcon, adminOnly: true },
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
      title: "ANALYTICS",
      id: "analytics",
      icon: BarChart3,
      placeholder: true,
      items: []
    }
  ]

  return (
    <aside className="w-64 border-r border-border/40 bg-card hidden md:flex flex-col h-screen sticky top-0 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border/40 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Music className="w-5 h-5 text-primary" />
        </div>
        <span className="font-heading font-black text-lg text-primary tracking-wider uppercase truncate">
          {user.name || (isAdmin ? "Admin" : "Agente")}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {sections.map((section) => {
          // Filter items based on admin role
          const visibleItems = section.items.filter(item => !item.adminOnly || isAdmin)
          
          // Don't show empty sections (except placeholders)
          if (visibleItems.length === 0 && !section.placeholder) return null

          const isExpanded = expandedSections[section.id]
          const SectionIcon = section.icon

          return (
            <div key={section.id} className="space-y-1">
              <button
                onClick={() => toggleSection(section.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-[10px] font-black tracking-widest uppercase transition-colors rounded-md",
                  section.placeholder ? "text-muted-foreground/40 cursor-not-allowed" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                disabled={section.placeholder}
              >
                <div className="flex items-center gap-2">
                  <SectionIcon className="w-3 h-3" />
                  {section.title}
                  {section.placeholder && <span className="ml-2 text-[8px] font-medium lowercase opacity-50">(soon)</span>}
                </div>
                {!section.placeholder && (
                  isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
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
                    <div className="space-y-0.5 ml-2 border-l border-border/40 pl-2 py-1">
                      {visibleItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all group relative",
                              isActive 
                                ? "bg-primary/10 text-primary shadow-sm" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                          >
                            <Icon className={cn(
                              "w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
                              isActive ? "text-primary" : "text-muted-foreground/70"
                            )} />
                            <span className="flex-1 truncate">{item.name}</span>
                            {item.badgeCount ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                {item.badgeCount}
                              </span>
                            ) : null}
                            {isActive && (
                              <motion.div 
                                layoutId="active-nav-indicator"
                                className="absolute left-0 w-1 h-4 bg-primary rounded-r-full"
                              />
                            )}
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
      <div className="p-4 border-t border-border/40 shrink-0">
        <Link 
          href="/" 
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-all group"
        >
          <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> 
          <span>Salir al sitio</span>
        </Link>
      </div>
    </aside>
  )
}
