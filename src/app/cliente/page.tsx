import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, CreditCard, Music, Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { formatDateMX } from "@/lib/utils"

export default async function ClienteDashboardPage(props: { searchParams: { quote_success?: string } }) {
  const session = await auth()
  const searchParams = await props.searchParams
  
  // Get real data if logged in
  let quotes: any[] = []
  if (session?.user?.id) {
    const profile = await db.clientProfile.findUnique({
      where: { userId: session.user.id }
    })
    
    if (profile) {
      quotes = await db.quote.findMany({
        where: { clientId: profile.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { items: true }
      })
    }
  }

  const latestQuote = quotes[0]

  return (
    <div className="p-4 md:p-8">
      {searchParams.quote_success === "1" && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-3 text-green-400">
          <CheckCircle className="w-5 h-5" />
          <p>¡Cotización solicitada exitosamente! Nuestro equipo te contactará muy pronto.</p>
        </div>
      )}
      
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-white tracking-tight">Bienvenido, {session?.user?.name || 'Cliente'}</h1>
        <p className="text-muted-foreground mt-1">Este es el estado actual de tus eventos y cotizaciones.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-card/50 border-border/40 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Actividad Reciente</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {quotes.length === 0 ? (
              <div className="py-6 text-center">
                <div className="text-xl font-bold font-heading text-white">No tienes cotizaciones activas</div>
                <p className="text-sm text-muted-foreground mt-1">Cotiza tu primer evento con nosotros</p>
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                {quotes.map(q => (
                  <div key={q.id} className="flex justify-between items-center p-3 rounded-md bg-white/5 border border-white/5">
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        {q.items[0]?.description?.split('(')[0] || "Cotización de Evento"}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 
                        {q.eventDate ? new Date(q.eventDate).toLocaleDateString() : 'Sin fecha'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">${q.totalEstimated.toLocaleString()} MXN</div>
                      <div className="text-[10px] uppercase font-bold text-yellow-500 tracking-wider">
                        {q.status === 'pendiente' ? 'EN REVISIÓN' : q.status === 'agendado' ? 'APROBADA' : 'CANCELADA'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Saldo Pendiente</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-heading mt-2">$0.00</div>
            <p className="text-xs text-muted-foreground mt-2">Pagos al corriente</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-primary/5 border-primary/20 overflow-hidden relative">
        <div className="absolute right-0 top-0 opacity-10">
            <Music className="w-64 h-64 -mt-12 -mr-12" />
        </div>
        <CardHeader className="relative z-10">
          <CardTitle className="font-heading text-xl text-primary">¿Listo para la mejor fiesta?</CardTitle>
          <CardDescription className="text-muted-foreground/80 max-w-lg">
            Estamos disponibles para acompañarte en tu próxima celebración. Conoce nuestros paquetes o arma uno a la medida de tu evento.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10 pt-4">
          <Link href="/cliente/cotizar">
            <Button>Nueva Cotización</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
