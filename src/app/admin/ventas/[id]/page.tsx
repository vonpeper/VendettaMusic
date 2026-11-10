export const dynamic = "force-dynamic"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookingActions } from "@/components/admin/BookingActions"
import { ClientWhatsappActions } from "@/components/admin/ClientWhatsappActions"
import { VenueTypeSwitcher } from "@/components/admin/VenueTypeSwitcher"
import { AdminManagementTools } from "@/components/admin/AdminManagementTools"
import { BookingStatusSwitcher } from "@/components/admin/BookingStatusSwitcher"
import { LiquidarButton } from "@/components/admin/LiquidarButton"
import { ConfirmarAnticipoButton } from "@/components/admin/ConfirmarAnticipoButton"
import { ContractStatusSwitcher } from "@/components/admin/ContractStatusSwitcher"
import { CommercialClosingCard } from "@/components/admin/CommercialClosingCard"
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Package, 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  ExternalLink,
  Download,
  Disc,
  Music2,
  Sparkles,
  Users,
  ChevronRight,
  LayoutList,
  FileText,
  FilePlus2
} from "lucide-react"
import Link from "next/link"
import { formatDateMX, cn } from "@/lib/utils"
import { MusicianStatusList } from "@/components/admin/MusicianStatusList"
import { EditEventoButton } from "@/components/admin/EventActions"
import { CancelBookingButton } from "@/components/admin/CancelBookingButton"
import { calculateEventHours } from "@/lib/pricing"

const MXN = (v: number) => new Intl.NumberFormat("es-MX", { 
  style: "currency", 
  currency: "MXN", 
  maximumFractionDigits: 0 
}).format(v)

export default async function DetalleSolicitudPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const rawId = id?.trim() || ""

  // Intentar buscar en BookingRequest (Web / Manual Moderno) por id o shortId
  let booking = await db.bookingRequest.findFirst({
    where: {
      OR: [
        { id: rawId },
        { shortId: rawId.toUpperCase() }
      ]
    },
    include: { 
      client: { include: { user: true } },
      lineItems: { orderBy: { order: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      event: { 
        include: { 
          bookingRequest: true,
          location: true,
          contracts: true,
          musicians: { 
            include: { 
              musician: { 
                include: { user: true } 
              } 
            } 
          }
        } 
      } 
    }
  })

  // Si no se encuentra, intentar buscar en Quote (Legacy)
  if (!booking) {
    const quote = await db.quote.findFirst({
      where: {
        OR: [
          { id: rawId }
        ]
      },
      include: {
        client: { include: { user: true } },
        event: {
          include: {
            bookingRequest: true,
            location: true,
            contracts: true,
            musicians: {
              include: {
                musician: {
                  include: { user: true }
                }
              }
            }
          }
        }
      }
    })
    
    if (quote) {
      // Mapear Quote Legacy a estructura de Booking para la vista
      booking = {
        id: quote.id,
        shortId: (quote as any).shortId || `LEG-${quote.id.slice(0, 5).toUpperCase()}`,
        clientName: quote.client?.user?.name || "Cliente Legacy",
        clientEmail: (quote as any).clientEmail || quote.client?.user?.email || "",
        clientPhone: (quote as any).clientPhone || quote.client?.whatsapp || "",
        status: quote.status,
        packageName: (quote as any).packageId || "Paquete Personalizado",
        requestedDate: quote.event?.date || quote.eventDate || new Date(),
        startTime: quote.event?.startTime || quote.event?.performanceStart || (quote as any).startTime || "00:00",
        endTime: quote.event?.performanceEnd || (quote as any).endTime || "00:00",
        address: quote.event?.location?.address || (quote as any).location || "Dirección no especificada",
        city: quote.event?.location?.city || "",
        state: quote.event?.location?.state || "",
        baseAmount: quote.totalEstimated,
        depositAmount: quote.event?.deposit || 0,
        paymentStatus: quote.status === "completado" ? "paid" : "pendiente",
        createdAt: quote.createdAt,
        source: "legacy",
        event: quote.event || null,
        clientId: quote.clientId,
        client: quote.client || null,
        venueType: quote.event?.venueType || quote.ceremonyType || "salon",
        customMusicianPay: quote.event?.customMusicianPay ?? null,
        customStaffPay: quote.event?.customStaffPay ?? null,
      } as any
    }
  }

  if (!booking) notFound()

  const [config, musicianProfiles, clients, locations, packages] = await Promise.all([
    db.globalConfig.findUnique({ where: { id: "vendetta_config" } }),
    db.musicianProfile.findMany({
      where: { 
        whatsapp: { not: null }, 
        status: "active"
      },
      include: { user: true },
      orderBy: { instrument: 'asc' }
    }),
    db.clientProfile.findMany({
      include: { user: true },
      orderBy: { user: { name: "asc" } }
    }),
    db.$queryRawUnsafe<any[]>(`SELECT * FROM Location ORDER BY name ASC`),
    db.package.findMany({ orderBy: { name: "asc" } }),
  ])

  // Buscar otras cotizaciones del mismo cliente
  const phoneClean10 = booking.clientPhone ? booking.clientPhone.replace(/\D/g, "").slice(-10) : ""
  let otherBookings: Array<{ id: string; shortId: string | null; packageName: string | null; requestedDate: Date | null; status: string; baseAmount: number }> = []
  
  if (booking.clientId || (phoneClean10 && phoneClean10.length === 10)) {
    otherBookings = await db.bookingRequest.findMany({
      where: {
        id: { not: booking.id },
        OR: [
          ...(booking.clientId ? [{ clientId: booking.clientId }] : []),
          ...(phoneClean10.length === 10 ? [{ clientPhone: { contains: phoneClean10 } }] : [])
        ]
      },
      select: {
        id: true,
        shortId: true,
        packageName: true,
        requestedDate: true,
        status: true,
        baseAmount: true
      },
      orderBy: { requestedDate: "desc" },
      take: 5
    })
  }

  // Aplanar para BookingActions (espera m.name, m.instrument)
  const musicians = musicianProfiles.map(m => ({
    id:         m.id,
    name:       m.user?.name || "Músico",
    instrument: m.instrument || null,
    whatsapp:   m.whatsapp,
    isTitular:  m.isTitular,
    status:     m.status,
  }))

  const clientsMapped = clients.map(c => ({
    id: c.id,
    name: c.user.name ?? c.user.email ?? "Sin nombre",
    phone: c.whatsapp || null,
    email: c.user.email || null,
    city: c.city || null
  }))
  
  const staffMapped = musicianProfiles
    .filter(p => 
      p.instrument?.toLowerCase().includes("ingeniero") || 
      p.instrument?.toLowerCase().includes("staff")
    )
    .map(p => ({ id: p.id, name: p.user.name ?? "Sin nombre" }))

  const allMusiciansMapped = musicianProfiles.map(p => ({ 
    id: p.id, 
    name: p.user.name ?? "Sin nombre",
    instrument: p.instrument || "Músico",
    isTitular: p.isTitular
  }))

  const notifications = await db.notification.findMany({
    where: {
      OR: [
        { bookingRequestId: booking.id },
        ...(booking.event?.id ? [{ eventId: booking.event.id }] : [])
      ]
    },
    orderBy: { createdAt: "desc" }
  })
  
  const missingFields: string[] = []
  if (!booking.address || booking.address === "Dirección no especificada" || booking.address.trim() === "") {
    missingFields.push("Dirección del evento")
  }
  if (!booking.startTime || booking.startTime === "00:00") {
    missingFields.push("Hora de inicio")
  }
  if (!booking.endTime || booking.endTime === "00:00") {
    missingFields.push("Hora de fin")
  }
  if (!booking.clientPhone || booking.clientPhone.trim() === "") {
    missingFields.push("Teléfono del cliente")
  }

  // Resolve the client's full name by picking the one (profile name vs funnel name) that is more complete (has more words).
  const profileName = booking.client?.user?.name?.trim();
  const bookingName = booking.clientName?.trim();
  let finalClientName = "Sin nombre";
  if (profileName && bookingName) {
    const profileWords = profileName.split(/\s+/).filter(Boolean).length;
    const bookingWords = bookingName.split(/\s+/).filter(Boolean).length;
    finalClientName = profileWords >= bookingWords ? profileName : bookingName;
  } else {
    finalClientName = bookingName || profileName || "Sin nombre";
  }

  // Conceptos adicionales y desglose financiero unificado
  const lineItems = (booking.lineItems || []).map((it: any) => ({
    id: it.id,
    description: it.description,
    quantity: it.quantity,
    unitCost: it.unitCost,
    lineTotal: Number(it.lineTotal || (it.quantity * it.unitCost) || 0)
  }));
  const lineItemsTotal = lineItems.reduce((acc: number, it: any) => acc + it.lineTotal, 0);

  // Encontrar paquete asignado para sugerencias automáticas de precios
  const targetPkg = packages.find(p => 
    p.id === booking.packageId || 
    (booking.packageName && p.name.toLowerCase() === booking.packageName.toLowerCase()) ||
    (booking.packageName && p.name.toLowerCase().includes(booking.packageName.toLowerCase())) ||
    (booking.packageName && booking.packageName.toLowerCase().includes(p.name.toLowerCase()))
  );
  const defaultPkgBase = targetPkg ? (targetPkg.baseCostPerHour * (targetPkg.minDuration || 2)) : 0;

  const resolvedBase = Number(booking.baseAmount) > 0 
    ? Number(booking.baseAmount) 
    : (Number(booking.event?.amount) > 0 ? Number(booking.event?.amount) : defaultPkgBase);

  const resolvedViaticos = Number(booking.viaticosAmount) || 0;

  const resolvedDiscount = Math.abs(Number(booking.discountAmount) || 0);
  const resolvedDeposit = Number(booking.depositAmount) || 0;

  const effectiveStartTime = booking.event?.performanceStart || (booking.event as any)?.startTime || booking.startTime;
  const effectiveEndTime = booking.event?.performanceEnd || (booking.event as any)?.endTime || booking.endTime;
  const dynamicHours = calculateEventHours(effectiveStartTime, effectiveEndTime);

  const packagesMappedForModal = packages.map(p => ({
    id: p.id,
    name: p.name,
    baseCostPerHour: p.baseCostPerHour,
    minDuration: p.minDuration
  }));

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb trail + accesos rápidos */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          {/* Breadcrumb izquierdo */}
          <nav className="flex items-center gap-1 text-sm text-muted-foreground font-medium">
            <Link href="/admin" className="hover:text-foreground transition-colors">Admin</Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            <Link href="/admin/ventas" className="hover:text-foreground transition-colors">Centro de Ventas</Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            <span className="text-foreground font-black">{booking.shortId}</span>
          </nav>

          <div className="flex items-center gap-3">
            {/* Acceso rápido a Eventos */}
            <Link
              href="/admin/eventualidades"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-600/10 border border-blue-600/20 text-blue-600 text-xs font-black uppercase tracking-wider hover:bg-blue-600/20 transition-all cursor-pointer"
            >
              <LayoutList className="w-3.5 h-3.5" />
              Ver Eventos
            </Link>

            {/* Separador visual */}
            <span className="h-6 w-px bg-border/60 mx-1" />

            {/* Acceso rápido a Editar Evento (Pencil Icon) */}
            <EditEventoButton 
              eventId={booking.event?.id || booking.id}
              initialData={booking.event ? {
                ...booking.event,
                id: booking.event.id,
                targetId: booking.event.id,
                client: booking.client,
                clientId: booking.clientId || booking.client?.id,
                clientName: booking.clientName || booking.client?.user?.name || "",
                clientPhone: booking.clientPhone || booking.client?.whatsapp || "",
                clientEmail: booking.clientEmail || booking.client?.user?.email || "",
                city: booking.city || booking.client?.city || "",
                packageId: booking.event.packageId || booking.packageId,
                packageName: booking.packageName,
                basePrice: resolvedBase,
                baseAmount: resolvedBase,
                viaticos: resolvedViaticos,
                viaticosAmount: resolvedViaticos,
                discountAmount: resolvedDiscount,
                deposit: booking.event.deposit ?? resolvedDeposit,
                depositAmount: booking.event.deposit ?? resolvedDeposit,
                invoice: booking.event.invoice ?? booking.invoice ?? false,
                venueName: booking.event.location?.name || booking.venueType || booking.address || "",
                venueAddress: booking.event.location?.address || booking.address || "",
                venueCity: booking.event.location?.city || booking.city || "Toluca",
                venueState: booking.event.location?.state || booking.state || "Estado de México",
                mapsLink: booking.event.mapsLink || booking.event.location?.mapsLink || booking.mapsLink || "",
                startTime: booking.event.performanceStart || (booking.event as any).startTime || booking.startTime,
                endTime: booking.event.performanceEnd || (booking.event as any).endTime || booking.endTime,
                date: booking.event.date || booking.requestedDate,
                eventDate: booking.event.date || booking.requestedDate,
                guestCount: booking.event.guestCount || booking.guestCount || 0,
                ceremonyType: booking.event.ceremonyType || booking.ceremonyType || booking.venueType || "boda",
                customName: booking.event.customName || booking.customName || (booking.clientName ? `Evento de ${booking.clientName}` : "Evento Vendetta"),
                dressCode: booking.event.dressCode || booking.dressCode,
                musicianNotes: booking.event.musicianNotes || booking.musicianNotes,
                arrivalTime: booking.event.arrivalTime || booking.arrivalTime,
                setupTime: booking.event.setupTime || booking.setupTime,
                lineItems: lineItems,
                bookingRequest: booking,
                status: booking.event.status || booking.status || "agendado",
              } : {
                id: booking.id,
                targetId: booking.id,
                bookingId: booking.id,
                bookingRequest: booking,
                clientId: booking.clientId || booking.client?.id,
                client: booking.client,
                clientName: booking.clientName || booking.client?.user?.name || "",
                clientPhone: booking.clientPhone || booking.client?.whatsapp || "",
                clientEmail: booking.clientEmail || booking.client?.user?.email || "",
                city: booking.city || booking.client?.city || "",
                packageId: booking.packageId,
                date: booking.requestedDate,
                eventDate: booking.requestedDate,
                basePrice: resolvedBase,
                baseAmount: resolvedBase,
                amount: resolvedBase,
                deposit: resolvedDeposit,
                depositAmount: resolvedDeposit,
                paymentMethod: booking.paymentMethod,
                ceremonyType: booking.ceremonyType || booking.venueType || "otro",
                venueName: booking.venueType || booking.address || "",
                venueAddress: booking.address || "",
                venueCity: booking.city || "Toluca",
                venueState: booking.state || "Estado de México",
                mapsLink: booking.mapsLink || "",
                guestCount: booking.guestCount || 0,
                performanceStart: booking.startTime,
                performanceEnd: booking.endTime,
                startTime: booking.startTime,
                endTime: booking.endTime,
                status: booking.status || "pendiente_aprobacion",
                invoice: booking.invoice || false,
                customName: booking.customName || (booking.clientName ? `Evento de ${booking.clientName}` : "Evento Vendetta"),
                arrivalTime: booking.arrivalTime,
                setupTime: booking.setupTime,
                dressCode: booking.dressCode,
                musicianNotes: booking.musicianNotes,
                viaticos: resolvedViaticos,
                viaticosAmount: resolvedViaticos,
                discountAmount: resolvedDiscount,
                lineItems: lineItems,
              }}
              clients={clientsMapped}
              locations={locations}
              packages={packages}
              staff={staffMapped}
              allMusicians={allMusiciansMapped}
              showText={false}
              variant="outline"
              label=""
              className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-600/20 text-blue-600 hover:bg-blue-600/20 transition-all cursor-pointer p-0"
            />

            {/* Descargar PDF (Red PDF Icon) */}
            <Button 
              variant="outline"
              asChild
              className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-red-600/10 border border-red-600/20 text-red-600 hover:bg-red-600/20 transition-all cursor-pointer p-0"
              title={booking.status === "pendiente" ? "Descargar Cotización PDF" : "Descargar Contrato PDF"}
            >
              <a href={`/api/admin/contract/${booking.id}?t=${Date.now()}`}>
                <FileText className="w-4 h-4" />
              </a>
            </Button>

            {/* Cancelar/Eliminar Solicitud (Trash Icon) */}
            <CancelBookingButton
              bookingId={booking.id}
              shortId={booking.shortId || ""}
              hasEvent={!!booking.event}
              redirectOnSuccess={true}
              variant="outline"
              label=""
              className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-red-600/10 border border-red-600/20 text-red-600 hover:bg-red-600/20 transition-all cursor-pointer p-0"
            />
          </div>
        </div>

        {/* Header con ID y Estado */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-heading font-black text-foreground tracking-tight">Solicitud {booking.shortId}</h1>
              <BookingStatusSwitcher bookingId={booking.id} currentStatus={booking.status} missingFields={missingFields} />
            </div>
            <p className="text-muted-foreground mt-1">Registrado el {formatDateMX(booking.createdAt, "PPPP")}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <VenueTypeSwitcher bookingId={booking.id} currentType={booking.venueType || ''} />

            {(booking.status === "agendado" || booking.status === "confirmed" || booking.status === "pendiente" || booking.status === "completado") && (
              <ContractStatusSwitcher 
                bookingId={booking.id} 
                status={booking.event?.contracts?.[0]?.status || "pending"} 
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Información Detallada */}
          <div className="lg:col-span-2 space-y-8">
            {/* Ficha de Cierre Comercial Ejecutiva */}
            <CommercialClosingCard
              key={`closing-card-${booking.id}-${resolvedBase}-${resolvedViaticos}-${resolvedDiscount}-${lineItemsTotal}-${(booking.lineItems || []).length}`}
              bookingId={booking.id}
              shortId={booking.shortId || ""}
              clientName={finalClientName}
              clientPhone={booking.clientPhone}
              clientEmail={booking.clientEmail || undefined}
              currentStatus={booking.status}
              eventDate={booking.requestedDate}
              startTime={effectiveStartTime}
              endTime={effectiveEndTime}
              city={booking.city}
              state={booking.state}
              address={booking.address}
              mapsLink={booking.mapsLink || booking.event?.mapsLink || undefined}
              venueType={booking.venueType || booking.ceremonyType}
              guestCount={booking.guestCount || undefined}
              isOutsideZone={booking.isOutsideZone || undefined}
              distanceKm={booking.distanceKm || undefined}
              initialTollCost={booking.tollCost}
              initialFuelCost={booking.fuelCost}
              initialPackage={booking.packageName || targetPkg?.name || "Show Vendetta - Experience"}
              initialBase={resolvedBase}
              initialViaticos={resolvedViaticos}
              initialDiscount={resolvedDiscount}
              initialDeposit={booking.depositAmount || 0}
              initialLineItemsTotal={lineItemsTotal}
              initialLineItems={booking.lineItems}
              packagesList={packagesMappedForModal}
              initialCustomMusicianPay={booking.customMusicianPay ?? booking.event?.customMusicianPay}
              initialStaffPay={booking.customStaffPay ?? booking.event?.customStaffPay}
              musiciansCount={booking.event?.musicians?.length || 4}
              initialInvoice={Boolean(booking.invoice || booking.event?.invoice)}
              isContractSigned={Boolean(booking.signedAt || booking.clientSignature || booking.event?.contracts?.some((c: any) => c.status === 'signed' || c.status === 'firmado' || c.signedAt))}
            />
          </div>

          {/* Columna Derecha: Cliente y Acciones Administrativas */}
          <div className="space-y-8">
            {/* Tarjeta del Cliente */}
            <Card className="bg-card border-border shadow-xs rounded-2xl">
              <CardHeader className="py-4 px-6 border-b border-border/40">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Datos del Solicitante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <User className="text-primary w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg font-black text-foreground tracking-tight truncate" title={finalClientName}>
                      {finalClientName}
                    </div>
                    <div className="text-xs text-muted-foreground font-semibold truncate">
                      Origen: <span className="text-primary font-bold uppercase tracking-wider">{booking.source || 'WEB'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-border/40 text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground font-medium">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    <a href={`tel:${booking.clientPhone}`} className="hover:text-foreground hover:underline truncate">
                      {booking.clientPhone}
                    </a>
                  </div>
                  {booking.clientEmail && (
                    <div className="flex items-center gap-3 text-muted-foreground font-medium">
                      <Mail className="w-4 h-4 text-primary shrink-0" />
                      <a href={`mailto:${booking.clientEmail}`} className="hover:text-foreground hover:underline truncate">
                        {booking.clientEmail}
                      </a>
                    </div>
                  )}
                </div>

                <div className="pt-2 space-y-3">
                  <Button
                    variant="outline"
                    asChild
                    className="w-full text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 rounded-xl h-10 gap-2 font-bold text-xs"
                  >
                    <a 
                      href={`https://wa.me/${booking.clientPhone.replace(/\D/g, "")}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir WhatsApp Directo
                    </a>
                  </Button>

                  <ClientWhatsappActions 
                    bookingId={booking.id} 
                    clientPhone={booking.clientPhone} 
                    notifications={(booking as any).notifications || []}
                    bookingStatus={booking.status}
                  />

                  {/* Botón para crear otra cotización para este mismo cliente */}
                  <Button
                    asChild
                    variant="outline"
                    className="w-full h-10 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary font-bold text-xs gap-2 rounded-xl transition-all shadow-sm"
                  >
                    <Link
                      href={`/admin/ventas/manual?${new URLSearchParams({
                        ...(booking.clientId ? { clientId: booking.clientId } : {}),
                        clientName: finalClientName || booking.clientName || "",
                        clientPhone: booking.clientPhone || "",
                        clientEmail: booking.clientEmail || "",
                        city: booking.city || ""
                      }).toString()}`}
                    >
                      <FilePlus2 className="w-4 h-4" />
                      Nueva Cotización para este Cliente
                    </Link>
                  </Button>

                  {/* Listado de otras cotizaciones del mismo cliente si existen */}
                  {otherBookings.length > 0 && (
                    <div className="pt-3 border-t border-border/40 space-y-2">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                        <span>Otras cotizaciones ({otherBookings.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {otherBookings.map(ob => (
                          <Link
                            key={ob.id}
                            href={`/admin/ventas/${ob.id}`}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/40 hover:bg-muted text-xs border border-border/40 transition-colors group"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                {ob.shortId || ob.id.slice(0, 8)} • {ob.packageName || "Show Vendetta"}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {ob.requestedDate ? formatDateMX(ob.requestedDate) : "Sin fecha"}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <Badge variant="outline" className="text-[9px] uppercase">
                                {ob.status}
                              </Badge>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Gestión de Staff (Siempre visible si está agendado o pendiente) */}
            {(booking.status === "pendiente" || booking.status === "agendado") && (
              <Card className="bg-card border-border shadow-xs rounded-2xl">
                <CardHeader className="py-4 px-6 border-b border-border/40">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {booking.status === "pendiente" ? "Acciones Administrativas" : "Gestión de Staff y Logística"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <BookingActions 
                    bookingId={booking.id} 
                    clientName={finalClientName} 
                    musicians={musicians}
                    isAlreadyScheduled={!!booking.eventId}
                    currentMusicianIds={booking.event?.musicians?.map((m: any) => m.musicianId) || []}
                    eventMusicians={booking.event?.musicians || []}
                    notifications={(booking as any).notifications || []}
                  />
                </CardContent>
              </Card>
            )}

            {booking.status === "agendado" && !booking.eventId && (
              <Card className="bg-amber-500/5 border-amber-500/20 shadow-xs rounded-2xl">
                <CardHeader className="py-4 px-6 border-b border-amber-500/20">
                  <CardTitle className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Sincronización Pendiente
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-xs text-muted-foreground font-medium">Esta reserva está confirmada pero aún no se ha generado el evento oficial en la agenda.</p>
                  <BookingActions bookingId={booking.id} clientName={finalClientName} forceSync={true} />
                </CardContent>
              </Card>
            )}
            
            {booking.status === "EXPIRED" && (
              <Card className="bg-red-500/5 border-red-500/20 shadow-xs rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 text-red-500">
                    <TrendingDown className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="text-sm font-bold uppercase tracking-tight">Solicitud Expirada</div>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">Esta oportunidad superó los 15 días sin concretarse.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bitácora Administrativa y Notas de Músicos Unificada */}
            {(booking.adminNote || booking.musicianNotes) && (
              <Card className="bg-card border-border shadow-xs rounded-2xl overflow-hidden">
                <CardHeader className="py-3 px-5 border-b border-border/40 bg-muted/20">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Notas y Bitácora del Evento
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {booking.adminNote && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Bitácora Administrativa
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/30 italic">
                        &ldquo;{booking.adminNote}&rdquo;
                      </p>
                    </div>
                  )}
                  {booking.musicianNotes && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Indicaciones para Músicos
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed bg-amber-500/5 p-3 rounded-xl border border-amber-500/20 italic">
                        &ldquo;{booking.musicianNotes}&rdquo;
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Confirmaciones de Staff */}
            {booking.event && booking.event.musicians && booking.event.musicians.length > 0 && (
              <Card className="bg-card border-border shadow-xs rounded-2xl overflow-hidden">
                <CardHeader className="py-3 px-5 bg-muted/20 border-b border-border/40">
                  <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Estatus del Staff
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
              {booking.event?.id && booking.event.musicians && booking.event.musicians.length > 0 && (() => {
                const eventDate = new Date(booking.event.date)
                const now = new Date()
                const eventIsToday =
                  eventDate.getFullYear() === now.getFullYear() &&
                  eventDate.getMonth() === now.getMonth() &&
                  eventDate.getDate() === now.getDate()
                return (
                  <MusicianStatusList
                    musicians={booking.event.musicians}
                    eventId={booking.event?.id || booking.eventId || ""}
                    bookingId={booking.id}
                    isToday={eventIsToday}
                  />
                )
              })()}
                </CardContent>
              </Card>
            )}

            {/* Gestión del Registro (Editar/Eliminar) - Solo visible si hay un contrato registrado para poder borrarlo */}
            {!!(booking.event?.contracts?.length || booking.signedAt || booking.clientSignature) && (
              <Card className="bg-card border-border shadow-xs rounded-2xl">
                <CardHeader className="py-4 px-6 border-b border-border/40">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gestión de Registro</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <AdminManagementTools booking={booking} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    pendiente: { color: "text-yellow-400 border-yellow-700/40 bg-yellow-900/20", label: "PENDIENTE" },
    agendado:  { color: "text-green-400 border-green-700/40 bg-green-900/20", label: "AGENDADO" },
    cancelado: { color: "text-red-400 border-red-700/40 bg-red-900/20", label: "CANCELADO" },
    EXPIRED:   { color: "text-muted-foreground border-gray-700 bg-gray-800/50", label: "EXPIRADO" },
  }
  const cfg = configs[status] || configs.pendiente
  return (
    <Badge className={`${cfg.color} border px-3 py-1 text-xs font-black tracking-widest`}>
      {cfg.label}
    </Badge>
  )
}

function CheckCircle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  )
}

function TrendingDown(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
  )
}
