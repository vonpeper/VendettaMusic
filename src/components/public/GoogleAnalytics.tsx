"use client"

import Script from "next/script"

interface GoogleAnalyticsProps {
  measurementId?: string | null
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const gaId = measurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  if (!gaId || gaId.trim() === "") {
    return null
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  )
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
