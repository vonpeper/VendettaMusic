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
    where:   { active: true },
    orderBy: { baseCostPerHour: "asc" }
  })

  const initialStep = params.step ? parseInt(params.step, 10) : 0
  const config = await db.globalConfig.findUnique({ where: { id: "singleton" } })

  return (
    <FunnelWizard
      packages={packages}
      initialStep={initialStep}
      initialPkgId={params.pkg}
      initialCity={params.city}
      viaticosConfig={{}}
    />
  )
}
