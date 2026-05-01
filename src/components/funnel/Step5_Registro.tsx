"use client"

import { useState } from "react"
import { FunnelData } from "./FunnelWizard"
import { Button }     from "@/components/ui/button"
import { Input }      from "@/components/ui/input"
import { Label }      from "@/components/ui/label"
import { User, Phone, Mail, MapPin, Lock, Loader2, CheckCircle2, Calendar, Package } from "lucide-react"
import { formatDateMX } from "@/lib/utils"

interface Props {
  data: Partial<FunnelData>
  onNext: (d: Partial<FunnelData>) => void
  onBack: () => void
}

const MXN = (v: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v)

export default function Step5_Registro({ data, onNext, onBack }: Props) {
  const [name,    setName]    = useState(data.clientName  ?? "")
  const [phone,   setPhone]   = useState(data.clientPhone ?? "")
  const [email,   setEmail]   = useState(data.clientEmail ?? "")
  const [agreed,  setAgreed]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  // Sincronizar hacia arriba si cambian los campos para evitar pérdida de datos en re-renders
  const syncWithParent = (partial: Partial<FunnelData>) => {
    // Solo actualizamos localmente, handleSubmit se encargará de pasar todo al final
    // pero guardamos en data para persistencia si el componente se desmonta
  }

  const base    = (data.packagePrice ?? 0) + (data.viaticosAmount ?? 0)
  const deposit = data.depositAmount ?? 0

  const eventDate = data.requestedDate
    ? formatDateMX(data.requestedDate, "PPPP")
    : "Por confirmar"

  async function handleSubmit() {
    if (!name.trim())  { setError("Escribe tu nombre completo."); return }
    if (!phone.trim()) { setError("Escribe tu número de WhatsApp."); return }
    // Email es ahora opcional
    if (email.trim() && !email.includes("@")) { setError("Escribe un correo válido (u omitelo)."); return }
    if (!agreed)       { setError("Acepta los términos para continuar."); return }

    setLoading(true)
    setError("")
    try {
      const res  = await fetch("/api/booking", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId:    data.packageId,
          packageName:  data.packageName,
          guestCount:   data.guestCount,
          venueType:    data.venueType,
          street:       data.street,
          houseNumber:  data.houseNumber,
          colonia:      data.colonia,
          zipCode:      data.zipCode,
          address:      data.address,
          city:         data.city,
          state:        data.state,
          mapsLink:     data.mapsLink,
          requestedDate: data.requestedDate,
          startTime:    data.startTime,
          endTime:      data.endTime,
          baseAmount:   base,
          depositAmount: deposit,
          paymentMethod: data.paymentMethod,
          clientName:   name,
          clientPhone:  phone,
          clientEmail:  email,
          isPublic:     data.isPublic,
          clientProvidesAudio: data.clientProvidesAudio,
        })
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error ?? "Error al enviar la solicitud.")
        setLoading(false)
        return
      }

      // Si eligió Stripe, redirige a Checkout antes de mostrar success.
      if (data.paymentMethod === "stripe") {
        const checkout = await fetch("/api/payments/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: json.bookingId }),
        })
        const cj = await checkout.json()
        if (!checkout.ok || !cj.url) {
          setError(cj.error || "No se pudo iniciar el pago en línea.")
          setLoading(false)
          return
        }
        window.location.href = cj.url
        return
      }

      // CRITICO: Pasar el shortId que generó la API para que Success lo use
      onNext({
        clientName: name,
        clientPhone: phone,
        clientEmail: email,
        bookingId: json.bookingId,
        shortId: json.shortId
      })
    } catch (e) {
      console.error("Submit Error:", e)
      setError("Error de conexión. Intenta de nuevo.")
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-heading font-black text-white tracking-tight">
          Ya casi <span className="text-primary">terminamos</span> 🎸
        </h2>
        <p className="text-muted-foreground mt-2">
          Completa tus datos y recibirás la confirmación por WhatsApp.
        </p>
      </div>

      {/* Resumen del pedido */}
      <div className="bg-card/40 border border-primary/20 rounded-2xl p-5 mb-6 space-y-3">
        <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Resumen de tu pedido</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Package  className="w-4 h-4 text-primary shrink-0" />
            <span className="text-muted-foreground">Paquete:</span>
            <span className="text-white font-bold">{data.packageName}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary shrink-0" />
            <span className="text-muted-foreground">Invitados:</span>
            <span className="text-white font-bold">{data.guestCount}</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <span className="text-muted-foreground">Fecha:</span>
            <span className="text-white font-bold capitalize">{eventDate}, {data.startTime}–{data.endTime}</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <div className="text-white">
              <span className="font-bold">{data.street} {data.houseNumber}</span>, 
              <span> Col. {data.colonia}</span>, 
              <span> CP {data.zipCode}</span>, 
              <span className="block text-[10px] text-gray-500 uppercase tracking-wider">{data.city}, {data.state}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-between pt-3 border-t border-white/10">
          <div>
            <div className="text-xs text-muted-foreground">Anticipo a pagar hoy</div>
            <div className="text-2xl font-black text-primary">{MXN(deposit)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Resta el día del evento</div>
            <div className="text-xl font-bold text-white">{MXN(base - deposit)}</div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="space-y-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2 text-white">
            <User className="w-4 h-4 text-primary" /> Nombre completo
          </Label>
          <Input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tu nombre (s) y apellidos"
            className="bg-card/50 border-white/15 h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2 text-white">
            <Phone className="w-4 h-4 text-primary" /> WhatsApp
          </Label>
          <Input
            id="phone"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+52 1 722 000 0000"
            type="tel"
            className="bg-card/50 border-white/15 h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2 text-white">
            <Mail className="w-4 h-4 text-primary" /> Correo electrónico <span className="text-[10px] text-muted-foreground font-normal">(Opcional)</span>
          </Label>
          <Input
            id="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            type="email"
            className="bg-card/50 border-white/15 h-12 text-base"
          />
        </div>
      </div>

      {/* Aviso Obligatorio */}
      <div className="mb-6 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 space-y-2">
        <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">Aviso Importante Logística</h4>
        <p className="text-xs text-gray-300 leading-relaxed italic">
          "No incluye planta de luz. Es responsabilidad del cliente definir la capacidad del audio cotizado; 
          la banda no se hace responsable por abastecer audio adicional en el momento de la instalación si fuera necesario. 
          Al confirmar, usted acepta que la configuración seleccionada es suficiente para su evento."
        </p>
      </div>

      {/* Términos y Privacidad */}
      <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-colors">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-red-600"
          />
          <span className="text-sm text-gray-300">
            Acepto los <a href="/terminos-condiciones" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">términos y condiciones</a> y el <a href="/aviso-privacidad" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">aviso de privacidad</a>.
            <span className="block mt-1 text-xs text-muted-foreground">
              Entiendo que el anticipo es el {Math.round((deposit/base)*100)}% del total y que la reserva quedará confirmada
              una vez verificado el pago por el equipo de Vendetta.
            </span>
          </span>
        </label>
      </div>

      {error && (
        <p className="text-sm text-destructive mb-4 bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={loading} className="flex-1 border-white/15 h-12">
          ← Atrás
        </Button>
        <Button onClick={handleSubmit} disabled={loading} className="flex-1 font-black h-14 text-base">
          {loading
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando pedido...</>
            : <>🎸 Confirmar pedido</>
          }
        </Button>
      </div>
    </div>
  )
}
