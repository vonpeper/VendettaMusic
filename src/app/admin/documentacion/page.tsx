"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  BookOpen, 
  UserPlus, 
  Bell, 
  Calendar, 
  FileText, 
  CreditCard, 
  Settings,
  ChevronRight,
  HelpCircle,
  Smartphone,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"

const DOC_SECTIONS = [
  {
    id: "registro",
    title: "Registro y Onboarding",
    description: "Cómo los clientes inician su proceso en Vendetta.",
    icon: UserPlus,
    content: [
      {
        subtitle: "1. El Funnel de Ventas",
        text: "El proceso comienza cuando un cliente potencial completa el formulario en el sitio web (Funnel). Aquí eligen su paquete, fecha y ubicación.",
      },
      {
        subtitle: "2. Creación Automática de Cuenta",
        text: "Al finalizar el funnel, el sistema crea automáticamente una cuenta para el cliente usando su correo electrónico. Recibirán un enlace de acceso por correo.",
      },
      {
        subtitle: "3. Registro Manual",
        text: "Como administrador, puedes registrar clientes manualmente desde la sección 'Ventas' haciendo clic en 'Nuevo Registro'.",
      }
    ]
  },
  {
    id: "notificaciones",
    title: "Notificaciones y Músicos",
    description: "Flujo de comunicación con el staff.",
    icon: Bell,
    content: [
      {
        subtitle: "1. Convocatoria por WhatsApp",
        text: "Una vez agendado un evento, usa el botón de 'Campana' para enviar notificaciones automáticas a los músicos asignados.",
      },
      {
        subtitle: "2. Confirmación del Músico",
        text: "Cada músico recibe un enlace único donde puede ver los detalles del evento y confirmar su asistencia con un clic.",
      },
      {
        subtitle: "3. Semáforo de Confirmación",
        text: "En el dashboard, verás un punto de color: Gris (Sin enviar), Amarillo (Enviado/Pendiente), Verde (Confirmado).",
      }
    ]
  },
  {
    id: "eventos",
    title: "Gestión de Eventos",
    description: "Control total de la agenda y logística.",
    icon: Calendar,
    content: [
      {
        subtitle: "1. Agenda Maestra",
        text: "En 'Eventos' puedes ver todos los shows confirmados. Puedes filtrar por mes, cliente o estado de producción.",
      },
      {
        subtitle: "2. Detalles Logísticos",
        text: "Dentro de cada evento, puedes definir horarios de llegada, montaje, notas para músicos y links de ubicación.",
      }
    ]
  },
  {
    id: "finanzas",
    title: "Pagos y Contratos",
    description: "Liquidaciones y documentos legales.",
    icon: CreditCard,
    content: [
      {
        subtitle: "1. Firma de Contrato",
        text: "El cliente puede firmar digitalmente desde su panel. Una vez firmado, el sistema genera un PDF automático.",
      },
      {
        subtitle: "2. Control de Saldos",
        text: "Registra anticipos y pagos finales. El sistema calcula el balance pendiente automáticamente para cada evento.",
      }
    ]
  },
  {
    id: "logistica-manual",
    title: "Logística y Viáticos",
    description: "Configuración de gastos de viaje y transporte.",
    icon: Truck,
    content: [
      {
        subtitle: "1. Configuración Global de Viáticos",
        text: "En 'Configuración', puedes definir el costo por litro de gasolina, casetas promedio y el costo de mantenimiento por camioneta.",
      },
      {
        subtitle: "2. Cálculo Automático",
        text: "Al asignar una ubicación a un evento, el sistema calcula los viáticos basados en la distancia y los parámetros globales establecidos.",
      },
      {
        subtitle: "3. Ajustes Manuales",
        text: "Si un evento requiere un transporte especial, puedes sobrescribir el monto de viáticos directamente en la edición del evento.",
      }
    ]
  }
]

export default function DocumentacionPage() {
  const [search, setSearch] = useState("")
  const [activeSection, setActiveSection] = useState(DOC_SECTIONS[0].id)

  const filteredSections = useMemo(() => {
    if (!search) return DOC_SECTIONS
    return DOC_SECTIONS.map(s => ({
      ...s,
      content: s.content.filter(c => 
        c.subtitle.toLowerCase().includes(search.toLowerCase()) || 
        c.text.toLowerCase().includes(search.toLowerCase()) ||
        s.title.toLowerCase().includes(search.toLowerCase())
      )
    })).filter(s => s.content.length > 0)
  }, [search])

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-border/40 shadow-sm">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            <BookOpen className="w-10 h-10 text-primary" />
            Centro de Ayuda
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Guía paso a paso para dominar las funciones de Vendetta Admin.
          </p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar función o proceso..." 
            className="pl-12 h-14 bg-muted/30 border-none rounded-2xl text-lg focus-visible:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Temas principales</h3>
          {DOC_SECTIONS.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-start gap-4 p-4 rounded-2xl transition-all text-left group",
                  activeSection === section.id 
                    ? "bg-white border border-border/40 shadow-md ring-1 ring-primary/5" 
                    : "hover:bg-white/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                  activeSection === section.id ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/10"
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className={cn("font-bold text-sm uppercase tracking-tight", activeSection === section.id ? "text-foreground" : "")}>
                    {section.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {section.description}
                  </div>
                </div>
                {activeSection === section.id && (
                  <ChevronRight className="w-4 h-4 ml-auto self-center text-primary" />
                )}
              </button>
            )
          })}

          <Card className="mt-8 bg-gradient-to-br from-blue-600 to-blue-800 text-white border-none shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Smartphone className="w-24 h-24 rotate-12" />
            </div>
            <CardContent className="p-6 relative z-10">
              <h4 className="font-bold flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Soporte Directo
              </h4>
              <p className="text-xs text-white/80 mt-2 leading-relaxed">
                ¿Necesitas ayuda con una función específica no documentada?
              </p>
              <button className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all border border-white/20">
                Contactar Soporte
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8 space-y-6">
          {filteredSections.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-border/40 border-dashed">
              <HelpCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold">No encontramos lo que buscas</h3>
              <p className="text-muted-foreground mt-1">Intenta con otras palabras clave.</p>
            </div>
          ) : (
            filteredSections
              .filter(s => search ? true : s.id === activeSection)
              .map((section) => (
                <div key={section.id} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-1 w-12 bg-primary rounded-full" />
                    <h2 className="text-2xl font-black uppercase tracking-tighter">{section.title}</h2>
                  </div>
                  
                  <div className="grid gap-6">
                    {section.content.map((item, idx) => (
                      <Card key={idx} className="bg-white border-border/40 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader>
                          <CardTitle className="text-lg font-bold flex items-center gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600/10 text-blue-600 text-[10px] font-black">
                              {idx + 1}
                            </span>
                            {item.subtitle}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {item.text}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  )
}
