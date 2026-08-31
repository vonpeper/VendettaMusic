import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { User, Mail, Phone, MapPin } from "lucide-react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export default async function PerfilPage() {
  const session = await auth()
  let profile: any = null
  let user: any = null

  if (session?.user?.id) {
    user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { clientProfile: true }
    })
    profile = user?.clientProfile
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-white tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground mt-1">Información de contacto y facturación de tu cuenta.</p>
      </div>

      <Card className="bg-card/50 border-border/40">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> Datos Generales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5" /> Nombre
              </span>
              <p className="font-semibold text-white">{user?.name || "Sin registrar"}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                <Mail className="w-3.5 h-3.5" /> Correo Electrónico
              </span>
              <p className="font-semibold text-white">{user?.email || "Sin registrar"}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                <Phone className="w-3.5 h-3.5" /> Teléfono
              </span>
              <p className="font-semibold text-white">{profile?.whatsapp || "Sin registrar"}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5" /> Ciudad / Estado
              </span>
              <p className="font-semibold text-white">{profile?.city || "Toluca / CDMX"}, {profile?.state || "México"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
