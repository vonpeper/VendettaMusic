import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vendetta Agenda',
    short_name: 'Agenda',
    description: 'Agenda oficial de fechas, horarios, locaciones y notificaciones push para músicos de Vendetta.',
    start_url: '/agenda',
    scope: '/',
    display: 'standalone',
    background_color: '#070709',
    theme_color: '#dc2626',
    orientation: 'portrait',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/images/branding/logo-vendetta.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
