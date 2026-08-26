import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/agenda', '/fechas', '/calendario'],
      },
      {
        userAgent: 'facebookexternalhit',
        allow: '/',
      }
    ],
    sitemap: 'https://vendetta.mx/sitemap.xml',
  }
}
