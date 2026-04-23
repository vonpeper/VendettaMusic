export const dynamic = "force-dynamic"
import { db } from "@/lib/db"
import { NuevoClienteButton } from "@/components/admin/ClienteActions"
import { Users, FileQuestion, FileText, Building2, Calendar } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LocationsManager from "@/components/admin/LocationsClient"
import { ClientesTableClient } from "@/components/admin/ClientesTableClient"

export default async function AdminClientesPage() {
  const clients = await db.clientProfile.findMany({
    include: {
      user: true,
      _count: {
        select: { events: true, quotes: true }
      },
      events: {
        include: {
          contracts: true
        },
        orderBy: { date: "desc" },
        take: 3
      }
    },
    orderBy: { user: { name: "asc" } }
  })

  return (
    <div className="p-8 bg-background min-h-full pb-24">
      {/* Header General */}
      <div className="mb-10">
        <div className="flex items-center gap-3 text-primary mb-2">
          <Users className="w-6 h-6" />
          <span className="text-sm font-bold uppercase tracking-widest">Base de Datos Administrativa</span>
        </div>
        <h1 className="text-4xl font-heading font-bold text-white tracking-tight">
          Contactos y Logística
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Administra el directorio de clientes corporativos y privados, así como el catálogo de ubicaciones certificadas para eventos.
        </p>
      </div>

      <Tabs defaultValue="clientes" className="space-y-8">
        <TabsList className="bg-card/20 border border-white/10 p-1 rounded-xl">
          <TabsTrigger value="clientes" className="gap-2 px-6 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Users className="w-4 h-4" /> Directorio de Clientes
          </TabsTrigger>
          <TabsTrigger value="lugares" className="gap-2 px-6 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Building2 className="w-4 h-4" /> Ubicaciones y Venues
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Stats rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Clientes", value: clients.length, icon: Users, color: "text-primary" },
              {
                label: "Corporativos",
                value: clients.filter(c => c.type === "corporate").length,
                icon: FileText,
                color: "text-blue-400"
              },
              {
                label: "Total Eventos",
                value: clients.reduce((acc, c) => acc + c._count.events, 0),
                icon: Calendar,
                color: "text-green-400"
              },
              {
                label: "Cotizaciones",
                value: clients.reduce((acc, c) => acc + c._count.quotes, 0),
                icon: FileQuestion,
                color: "text-yellow-400"
              },
            ].map(stat => (
              <div key={stat.label} className="bg-card/40 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <NuevoClienteButton />
          </div>

          <ClientesTableClient items={clients} />
        </TabsContent>

        <TabsContent value="lugares" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <LocationsManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
