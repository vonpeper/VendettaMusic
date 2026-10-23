export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getGoogleMetricsAction } from "@/actions/google-metrics"
import { AnalyticsDashboardClient } from "@/components/admin/analytics/AnalyticsDashboardClient"

export default async function AdminAnalyticsPage() {
  const session = await auth()
  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "AGENTE")) {
    redirect("/admin")
  }

  const res = await getGoogleMetricsAction("28d")
  const initialData = res.data || {
    status: {
      isLinked: false,
      hasSearchConsole: false,
      hasAnalytics: false,
      siteUrl: null,
      propertyId: null,
      measurementId: null,
    },
    searchConsole: null,
    analytics: null,
    errors: {
      searchConsole: "No se pudieron cargar los datos iniciales",
    },
    lastUpdated: new Date().toISOString(),
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <AnalyticsDashboardClient initialData={initialData} initialPeriod="28d" />
    </div>
  )
}
