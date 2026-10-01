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
    "description": "Banda profesional de pop y rock en vivo de alto impacto para eventos corporativos, fiestas de cumpleaños, happenings, festivales y celebraciones exclusivas en México.",
    "email": "rock.vendettamx@gmail.com",
    "sameAs": sameAs,
    "areaServed": [
      { "@type": "Place", "name": "Metepec" },
      { "@type": "Place", "name": "Toluca" },
      { "@type": "Place", "name": "Valle de Bravo" },
      { "@type": "Place", "name": "Avándaro" },
      { "@type": "Place", "name": "Ciudad de México" },
      { "@type": "Place", "name": "Cuernavaca" },
      { "@type": "Place", "name": "Querétaro" },
      { "@type": "Place", "name": "Estado de México" },
      { "@type": "Place", "name": "Morelos" }
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
    "description": "Show de pop & rock en vivo con formato de concierto de gira para eventos corporativos, cumpleaños, bodas y festivales.",
    "genre": ["Pop Rock", "Rock", "Pop", "Concert Experience", "80s Pop", "90s Rock"],
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

  // 5. Esquemas de Servicios (Services)
  const servicesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "Service",
        "@id": "https://vendetta.mx/#servicio-corporativo",
        "name": "Música en Vivo para Eventos Corporativos y Cenas de Gala",
        "serviceType": "Corporate Event Entertainment",
        "provider": { "@id": "https://vendetta.mx/#organization" },
        "description": "Show musical en vivo de pop & rock para congresos, aniversarios de marcas, kick-offs y cenas de fin de año con facturación CFDI 4.0 y audio profesional.",
        "areaServed": ["Ciudad de México", "Toluca", "Metepec", "Valle de Bravo", "Cuernavaca", "Querétaro"]
      },
      {
        "@type": "Service",
        "@id": "https://vendetta.mx/#servicio-cumpleanos",
        "name": "Show de Pop & Rock para Cumpleaños y Fiestas Privadas",
        "serviceType": "Private Party & Birthday Live Band",
        "provider": { "@id": "https://vendetta.mx/#organization" },
        "description": "Concierto real en vivo para fiestas de 30, 40 y 50 años o aniversarios privados. Cero grupo versátil, sonido de festival con metales y voces.",
        "areaServed": ["Metepec", "Toluca", "Avándaro", "Valle de Bravo", "CDMX", "Cuernavaca", "Querétaro"]
      },
      {
        "@type": "Service",
        "@id": "https://vendetta.mx/#servicio-happening",
        "name": "Happening y Show Estelar de Concierto en Vivo",
        "serviceType": "Live Music Happening",
        "provider": { "@id": "https://vendetta.mx/#organization" },
        "description": "Intervención cumbre de 2 a 3 horas continuas de adrenalina sin pausas ni pistas pregrabadas.",
        "areaServed": ["Toluca", "Metepec", "CDMX", "Valle de Bravo", "Cuernavaca", "Querétaro"]
      }
    ]
  }

  // 6. Esquema de FAQPage
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Vendetta es un grupo versátil tradicional?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. Vendetta no es una orquesta o grupo versátil convencional. No usamos pistas pregrabadas, sombreros de hule espuma ni dinámicas trilladas. Somos una banda de concierto en vivo con un potente ensamble de pop & rock, sección de metales, dos vocalistas y una producción de audio e iluminación robótica de nivel festival."
        }
      },
      {
        "@type": "Question",
        "name": "¿Emiten factura fiscal (CFDI 4.0) para eventos empresariales y corporativos?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí, emitimos facturación electrónica formal con CFDI 4.0 y contamos con constancia de situación fiscal al día para cumplir con los requerimientos contables y de compras de empresas y agencias de eventos."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué incluye el show en vivo de Vendetta Live Music?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Nuestros shows incluyen quinteto o septeto con metales (voz femenina, voz masculina, guitarra eléctrica, bajo, batería acústica, saxofón y trompeta), sistema de audio profesional de alta gama (Electro-Voice / Line Array), iluminación robótica DMX e ingeniero de audio en sala."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuál es su área de cobertura para eventos?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Vendetta Live Music ofrece cobertura en Metepec, Toluca, Valle de Bravo, Avándaro, Ciudad de México (CDMX), Cuernavaca (Morelos) y Querétaro."
        }
      },
      {
        "@type": "Question",
        "name": "¿Con cuánta anticipación se debe reservar la fecha del evento?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Se recomienda reservar con al menos 2 a 6 meses de anticipación, especialmente para temporadas altas de fin de año corporativo y fines de semana de eventos sociales."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuentan con servicio de DJ para los recesos de la banda?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí, en nuestros paquetes incluimos servicio de DJ profesional para mantener la pista de baile encendida durante los intermedios del show en vivo."
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
      "description": "Show de pop & rock en vivo con atmósfera de concierto para bodas y eventos corporativos.",
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
    "description": "Video promocional de la banda de pop & rock Vendetta Live Music en vivo para eventos sociales y corporativos.",
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
    "description": evt.musicianNotes || "Show en vivo de pop y rock para conciertos y eventos privados.",
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
        id="services-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
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
