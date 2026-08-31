import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CreditCard, CheckCircle, Clock } from "lucide-react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export default async function PagosPage() {
  const session = await auth()
  let payments: any[] = []

  if (session?.user?.id) {
    const profile = await db.clientProfile.findUnique({
      where: { userId: session.user.id }
    })
    if (profile) {
      payments = await db.payment.findMany({
        where: {
          bookingRequest: { clientId: profile.id }
        },
        orderBy: { createdAt: "desc" },
        include: { bookingRequest: true }
      })
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-white tracking-tight">Pagos y Saldo</h1>
        <p className="text-muted-foreground mt-1">Consulta los recibos y estados de cuenta de tus eventos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-card/50 border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Estado de Pagos</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading mt-2 text-white">Al corriente</div>
            <p className="text-xs text-muted-foreground mt-1">Tus eventos se procesan conforme al calendario estipulado.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/40">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white">Historial de Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No hay registros de transacciones directas en línea todavía.</p>
          ) : (
            <div className="space-y-3">
              {payments.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                  <div>
                    <div className="text-sm font-semibold text-white">Folio: {p.bookingRequest?.shortId || "N/A"}</div>
                    <div className="text-xs text-muted-foreground">{p.method} • {new Date(p.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">${p.amount.toLocaleString()} MXN</div>
                    <div className="text-xs text-emerald-400 capitalize">{p.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
