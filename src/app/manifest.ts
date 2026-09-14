import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vendetta Live Music - Agenda',
    short_name: 'Vendetta',
    description: 'Agenda oficial de fechas, presentaciones y cotizaciones de Vendetta Live Music.',
    start_url: '/agenda',
    scope: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#dc2626',
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
