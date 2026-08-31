import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, Clock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export default async function MisEventosPage() {
  const session = await auth()
  let bookings: any[] = []
  
  if (session?.user?.id) {
    const profile = await db.clientProfile.findUnique({
      where: { userId: session.user.id }
    })
    if (profile) {
      bookings = await db.bookingRequest.findMany({
        where: { clientId: profile.id },
        orderBy: { requestedDate: "desc" },
        include: { event: true }
      })
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-white tracking-tight">Mis Eventos</h1>
        <p className="text-muted-foreground mt-1">Historial y agenda de tus eventos contratados con Vendetta.</p>
      </div>

      {bookings.length === 0 ? (
        <Card className="bg-card/50 border-border/40 text-center py-12">
          <CardContent>
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Aún no tienes eventos registrados</h3>
            <p className="text-sm text-muted-foreground mb-6">Genera tu primera cotización para agendar tu fecha.</p>
            <Link href="/cliente/cotizar">
              <Button>Cotizar Ahora</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => (
            <Card key={b.id} className="bg-card/50 border-border/40 hover:border-primary/50 transition-all">
              <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="inline-block text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary mb-2">
                    Folio: {b.shortId}
                  </div>
                  <h3 className="text-lg font-bold text-white">{b.packageName}</h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    {b.requestedDate ? new Date(b.requestedDate).toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "Fecha por confirmar"}
                    {" • "}{b.startTime} a {b.endTime} hrs
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-black text-white">${(b.baseAmount || 0).toLocaleString()} MXN</div>
                    <div className="text-xs font-semibold text-yellow-400 capitalize">{b.status}</div>
                  </div>
                  <Link href={`/status/${b.shortId}`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      Ver Estatus <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
