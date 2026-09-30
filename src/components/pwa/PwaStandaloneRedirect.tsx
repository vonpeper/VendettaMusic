'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface NavigatorStandalone {
  standalone?: boolean
}

export function PwaStandaloneRedirect() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // If user navigates back to agenda or another view, clear bypass so reopening app returns to agenda
    if (pathname === '/agenda') {
      try {
        sessionStorage.removeItem('pwa_view_web')
      } catch (e) {}
    }

    const nav = window.navigator as Navigator & NavigatorStandalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      nav.standalone === true ||
      Boolean(document.referrer && document.referrer.includes('android-app://'))

    const isExplicitWeb =
      window.location.search.includes('view=web') ||
      sessionStorage.getItem('pwa_view_web') === '1'

    // If installed app is opened at root landing page, redirect immediately to the live agenda
    if (isStandalone && pathname === '/' && !isExplicitWeb) {
      router.replace('/agenda')
    }
  }, [pathname, router])

  return null
}
