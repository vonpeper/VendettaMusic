import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vendetta Live Music',
    short_name: 'Vendetta',
    description: 'Grupo musical versátil de alto nivel para bodas, eventos corporativos y festivales en México.',
    start_url: '/',
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
