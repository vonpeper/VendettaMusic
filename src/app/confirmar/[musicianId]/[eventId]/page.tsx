import { db } from "@/lib/db"
import { confirmAttendanceAction } from "@/actions/confirmations"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Calendar, MapPin, Clock } from "lucide-react"
import Link from "next/link"

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ musicianId: string; eventId: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { musicianId, eventId } = await params
  const { success: successParam } = await searchParams
  const success = successParam === "true"

  const [musician, event] = await Promise.all([
    db.musicianProfile.findUnique({
      where: { id: musicianId },
      include: { user: true },
    }),
    db.event.findUnique({
      where: { id: eventId },
      include: { location: true },
    }),
  ])

  if (!musician || !event) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Enlace no válido</h1>
          <p className="text-gray-400">El evento o el músico no existen en nuestro sistema.</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-green-500/30 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-heading font-black text-white mb-2">¡Asistencia Confirmada!</h1>
          <p className="text-gray-400 mb-8">
            Gracias {musician.user.name}, tu asistencia para el evento con **{event.customName || "Vendetta"}** ha sido registrada correctamente.
          </p>
          <div className="space-y-4">
             <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-left">
                <div className="flex items-center gap-3 text-white font-bold mb-2">
                   <Calendar className="w-4 h-4 text-primary" />
                   {event.date.toLocaleDateString("es-MX", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                </div>
                {event.performanceStart && (
                  <div className="flex items-center gap-3 text-gray-300 text-sm mb-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Show: {event.performanceStart} {event.performanceEnd ? ` - ${event.performanceEnd}` : ''}
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-3 text-gray-300 text-sm">
                    <MapPin className="w-4 h-4 text-primary" />
                    {event.location.name}
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
             <span className="text-2xl">🤘</span>
          </div>
          <h1 className="text-2xl font-heading font-black text-white">Hola, {musician.user.name}</h1>
          <p className="text-gray-400 mt-2">¿Confirmas tu asistencia para este evento?</p>
        </div>

        <div className="p-5 bg-white/5 rounded-2xl border border-white/10 mb-8 space-y-3">
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-primary">●</span> {event.customName || "Show Vendetta"}
          </div>
          <div className="flex items-center gap-3 text-gray-300 text-sm">
            <Calendar className="w-4 h-4 text-primary" />
            {event.date.toLocaleDateString("es-MX", { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}
          </div>
          {event.performanceStart && (
            <div className="flex items-center gap-3 text-gray-300 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              {event.performanceStart} - {event.performanceEnd || '---'}
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-3 text-gray-300 text-sm">
              <MapPin className="w-4 h-4 text-primary" />
              {event.location.name}
            </div>
          )}
        </div>

        <form action={async () => {
          "use server"
          await confirmAttendanceAction(musicianId, eventId)
        }}>
          {/* We use a client component for the button to show loading state if needed, but for simplicity let's use a server action link or a simple button */}
          <ConfirmButton musicianId={musicianId} eventId={eventId} />
        </form>
        
        <p className="text-[10px] text-muted-foreground text-center mt-6 uppercase tracking-widest">
          Vendetta Operational Dashboard
        </p>
      </div>
    </div>
  )
}

function ConfirmButton({ musicianId, eventId }: { musicianId: string, eventId: string }) {
  // To keep it simple in a server component file, I'll create a small client component or just use a standard button
  // Actually, I should use a client component for the button to handle the redirect after confirmation.
  return (
    <Link href={`/confirmar/${musicianId}/${eventId}/go`} className="block">
       <Button className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
          SÍ, CONFIRMO ASISTENCIA
       </Button>
    </Link>
  )
}
