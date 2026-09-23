'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface NavigatorStandalone {
  standalone?: boolean
}

export function PwaStandaloneRedirect() {
  // PWA standalone mode allows full website navigation without hijacking the root path
  return null
}
