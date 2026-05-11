import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'facebookexternalhit',
        allow: '/',
      }
    ],
    sitemap: 'https://vendetta.mx/sitemap.xml',
  }
}
