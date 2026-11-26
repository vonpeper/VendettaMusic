"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

interface GoogleAnalyticsProps {
  measurementId?: string | null
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const pathname = usePathname()
  const gaId = measurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-455QYSRC2D"

  useEffect(() => {
    if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
      ;(window as any).gtag("event", "page_view", {
        page_path: pathname,
        send_to: gaId,
      })
    }
  }, [pathname, gaId])

  return null
}

/**
 * Función utilitaria para disparar eventos de conversión y seguimiento a GA4.
 * Es tolerante a fallos si un bloqueador de anuncios deshabilita gtag.
 */
export function trackGoogleEvent(eventName: string, eventParams?: Record<string, any>) {
  if (typeof window !== "undefined") {
    try {
      if (typeof (window as any).gtag === "function") {
        ;(window as any).gtag("event", eventName, eventParams)
      }
    } catch (err) {
      console.warn(`[GA4] Error al emitir evento '${eventName}':`, err)
    }
  }
}
