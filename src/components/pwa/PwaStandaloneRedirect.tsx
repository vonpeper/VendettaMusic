'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function PwaStandaloneRedirect() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')

    // If installed app is opened at root landing page, redirect immediately to the live agenda
    if (isStandalone && pathname === '/') {
      router.replace('/agenda')
    }
  }, [pathname, router])

  return null
}
