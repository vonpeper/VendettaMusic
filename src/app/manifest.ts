import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vendetta Live Music',
    short_name: 'Vendetta',
    description: 'Banda de pop y rock en vivo para bodas y eventos exclusivos. Agenda oficial, cotizaciones y repertorio.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#07080D',
    theme_color: '#07080D',
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
    shortcuts: [
      {
        name: 'Agenda de Shows',
        short_name: 'Agenda',
        description: 'Consultar fechas y calendario en vivo',
        url: '/agenda',
        icons: [{ src: '/icon.png', sizes: '192x192' }]
      },
      {
        name: 'Cotizar Evento',
        short_name: 'Cotizar',
        description: 'Cotizar banda para boda o evento privado',
        url: '/cotizar',
        icons: [{ src: '/icon.png', sizes: '192x192' }]
      }
    ]
  }
}
