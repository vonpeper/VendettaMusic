import { MetadataRoute } from 'next'
import { getNoticias } from '@/lib/noticias'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://vendetta.mx'

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/cotizar`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/repertorio`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/servicios`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/paquetes`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/noticias`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/musica-para-eventos/toluca`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/musica-para-eventos/cdmx`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/musica-para-eventos/valle-de-bravo`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ]

  let newsPages: MetadataRoute.Sitemap = []
  try {
    const posts = getNoticias()
    newsPages = posts.map(post => ({
      url: `${baseUrl}/noticias/${post.slug}`,
      lastModified: new Date(post.date || new Date()),
      changeFrequency: 'monthly',
      priority: 0.6,
    }))
  } catch (e) {
    console.error("Error generating dynamic news sitemap:", e)
  }

  return [...staticPages, ...newsPages]
}
