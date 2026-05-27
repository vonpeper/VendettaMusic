import { db }         from "@/lib/db"
import FunnelWizard  from "@/components/funnel/FunnelWizard"

export const metadata = {
  title: "Cotiza tu Evento | Vendetta",
  description: "Elige paquete, verifica disponibilidad y reserva tu fecha en minutos."
}

interface Props {
  searchParams: Promise<{ pkg?: string; city?: string; step?: string }>
}

export default async function CotizarPage({ searchParams }: Props) {
  const params = await searchParams
  const packages = await db.package.findMany({
    orderBy: { baseCostPerHour: "asc" }
  })

  const extras = await db.packageService.findMany({
    orderBy: { createdAt: "desc" }
  })

  const initialStep = params.step ? parseInt(params.step, 10) : 0
  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })

  return (
    <FunnelWizard
      packages={packages}
      extras={extras}
      initialStep={initialStep}
      initialPkgId={params.pkg}
      initialCity={params.city}
      viaticosConfig={{
        zona2Rate: config?.zona2Rate || undefined,
        zona3Rate: config?.zona3Rate || undefined,
        zona2Cities: (config as any)?.zona2Cities || undefined,
        zona3Cities: (config as any)?.zona3Cities || undefined,
      }}
      paymentConfig={{
        payMercadoPagoActive: config?.payMercadoPagoActive ?? true,
        payTransferenciaActive: config?.payTransferenciaActive ?? true,
        payPersonalActive: config?.payPersonalActive ?? true,
        payStripeActive: config?.payStripeActive ?? false,
      }}
    />
  )
}
