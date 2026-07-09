import Script from 'next/script'
import { db } from "@/lib/db"

export async function SchemaMarkup() {
  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
  const reviews = await db.review.findMany({ where: { status: "approved" } })
  const musicians = await db.publicBandMember.findMany({ orderBy: { order: "asc" } })
  
  // Obtener fechas futuras que sean públicas
  const publicEvents = await db.event.findMany({
    where: { 
      isPublic: true,
      date: { gte: new Date() }
    },
    include: { location: true },
    orderBy: { date: "asc" },
    take: 5
  })

  // 1. URLs de Redes y Configuración Base
  const logo = "https://vendetta.mx/images/branding/logo-vendetta.png"
  const sameAs = [
    config?.facebookUrl || "https://www.facebook.com/vendettamusica",
    config?.instagramUrl || "https://www.instagram.com/vendettamusica",
    config?.tiktokUrl || "https://www.tiktok.com/@vendetta.rock",
    "https://www.youtube.com/@vendettamx"
  ]

  // 2. Esquema de Organización (Organization)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://vendetta.mx/#organization",
    "name": "Vendetta Live Music",
    "url": "https://vendetta.mx",
    "logo": logo,
    "image": "https://vendetta.mx/images/shows/arma-tu-show.jpg",
    "description": "Grupo musical versátil de alto nivel para bodas, eventos corporativos y festivales en México.",
    "telephone": "+527222417045",
    "email": "rock.vendettamx@gmail.com",
    "sameAs": sameAs,
    "areaServed": [
      { "@type": "Place", "name": "Toluca" },
      { "@type": "Place", "name": "Metepec" },
      { "@type": "Place", "name": "Valle de Bravo" },
      { "@type": "Place", "name": "Estado de México" },
      { "@type": "Place", "name": "Ciudad de México" }
    ]
  }

  // 3. Esquema de MusicGroup / PerformingGroup
  const musicGroupSchema = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "@id": "https://vendetta.mx/#musicgroup",
    "name": "Vendetta Live Music",
    "url": "https://vendetta.mx",
    "logo": logo,
    "description": "Grupo musical versátil mexicano especializado en shows de pop & rock en vivo para bodas y eventos de alta gama.",
    "genre": ["Versatile", "Rock", "Pop", "Latin"],
    "sameAs": sameAs,
    "musicGroupMember": musicians.map(m => ({
      "@type": "OrganizationRole",
      "member": {
        "@type": "Person",
        "name": m.name,
        "jobTitle": m.role,
        "description": m.shortBio,
        "image": m.img.startsWith("http") ? m.img : `https://vendetta.mx${m.img}`
      },
      "roleName": m.role
    }))
  }

  // 4. Esquema de WebSite
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://vendetta.mx/#website",
    "url": "https://vendetta.mx",
    "name": "Vendetta Live Music",
    "publisher": {
      "@id": "https://vendetta.mx/#organization"
    }
  }

  // 5. Esquema de FAQPage
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Qué incluye el show versátil de Vendetta Live Music?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Nuestros shows incluyen quinteto o septeto con metales (voz femenina, voz masculina, guitarra, bajo, batería, saxofón y trompeta), sistema de audio profesional de alta gama (Electro-Voice / Line Array), iluminación arquitectónica o robótica y un ingeniero de audio calificado según el paquete seleccionado."
        }
      },
      {
        "@type": "Question",
        "name": "¿Con cuánta anticipación se debe reservar la fecha del evento?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Se recomienda reservar la fecha con al menos 3 a 6 meses de anticipación, ya que la agenda de fines de semana para bodas y eventos corporativos suele llenarse rápido. Puedes verificar disponibilidad y cotizar directamente en línea."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuál es su área de cobertura para eventos?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Vendetta Live Music ofrece cobertura en Toluca, Metepec, Valle de Bravo, el Estado de México, y la Ciudad de México (CDMX)."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuentan con servicio de DJ para los recesos de la banda?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí, en nuestro paquete Premium incluimos servicio de DJ profesional para mantener la pista de baile encendida durante los intermedios del show en vivo."
        }
      },
      {
        "@type": "Question",
        "name": "¿Pueden preparar canciones especiales para el evento?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí, si la canción del vals, primer baile o momento estelar no se encuentra en nuestro repertorio de más de 300 temas, la ensayamos y la preparamos exclusivamente para tu día sin costo adicional."
        }
      }
    ]
  }

  // 6. Esquema de Calificación Agregada (AggregateRating & Review)
  let ratingSchema: any = null
  if (reviews.length > 0) {
    const totalStars = reviews.reduce((sum, r) => sum + (r.stars || 5), 0)
    const averageRating = (totalStars / reviews.length).toFixed(1)
    
    ratingSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": "https://vendetta.mx/#product_rating",
      "name": "Servicio de Música en Vivo - Vendetta Live Music",
      "image": "https://vendetta.mx/images/shows/arma-tu-show.jpg",
      "description": "Show de música versátil en vivo para bodas y eventos corporativos.",
      "brand": {
        "@id": "https://vendetta.mx/#organization"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": averageRating,
        "reviewCount": reviews.length,
        "bestRating": "5",
        "worstRating": "1"
      },
      "review": reviews.slice(0, 5).map(r => ({
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": r.name
        },
        "datePublished": r.createdAt.toISOString().split('T')[0],
        "reviewBody": r.text,
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": r.stars || 5,
          "bestRating": "5",
          "worstRating": "1"
        }
      }))
    }
  }

  // 7. Esquema de Objeto de Video (VideoObject)
  const videoSchema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": "Vendetta Live Music Show en Acción",
    "description": "Video promocional de la banda versátil Vendetta Live Music en vivo para eventos sociales y corporativos.",
    "thumbnailUrl": [
      "https://img.youtube.com/vi/607_nxc0Rqc/maxresdefault.jpg"
    ],
    "uploadDate": "2026-05-01T00:00:00Z",
    "contentUrl": "https://www.youtube.com/watch?v=607_nxc0Rqc",
    "embedUrl": "https://www.youtube.com/embed/607_nxc0Rqc",
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": { "@type": "WriteAction" },
      "userInteractionCount": 1500
    }
  }

  // 8. Esquema de Próximos Eventos Públicos (MusicEvent)
  const eventSchemas = publicEvents.map(evt => ({
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    "name": evt.customName || "Presentación en Vivo - Vendetta",
    "startDate": evt.date.toISOString(),
    "location": {
      "@type": "Place",
      "name": evt.location?.name || "Por confirmar",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": evt.location?.address || "Por confirmar",
        "addressLocality": evt.location?.city || "Estado de México",
        "addressCountry": "MX"
      }
    },
    "image": "https://vendetta.mx/images/shows/arma-tu-show.jpg",
    "description": evt.musicianNotes || "Show en vivo de pop, rock y música versátil.",
    "performer": {
      "@id": "https://vendetta.mx/#musicgroup"
    }
  }))

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="musicgroup-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(musicGroupSchema) }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {ratingSchema && (
        <Script
          id="rating-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ratingSchema) }}
        />
      )}
      <Script
        id="video-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
      />
      {eventSchemas.map((schema, idx) => (
        <Script
          key={idx}
          id={`event-schema-${idx}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
