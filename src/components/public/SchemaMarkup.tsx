import Script from 'next/script'

export function SchemaMarkup() {
  const musicGroupSchema = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "name": "Vendetta Live Music",
    "url": "https://vendetta.mx",
    "logo": "https://vendetta.mx/logo.png",
    "sameAs": [
      "https://www.facebook.com/vendettamx",
      "https://www.instagram.com/vendettamx_",
      "https://www.youtube.com/@vendettamx"
    ],
    "genre": ["Versatile", "Rock", "Pop"],
    "description": "Grupo musical versátil de alto nivel para bodas, eventos corporativos y festivales en México."
  }

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Vendetta Live Music",
    "image": "https://vendetta.mx/images/hero.jpg",
    "@id": "https://vendetta.mx",
    "url": "https://vendetta.mx",
    "telephone": "+527222417045",
    "priceRange": "$$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Metepec",
      "addressLocality": "Toluca",
      "addressRegion": "Edomex",
      "postalCode": "52140",
      "addressCountry": "MX"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 19.25,
      "longitude": -99.6
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    }
  }

  return (
    <>
      <Script
        id="musicgroup-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(musicGroupSchema) }}
      />
      <Script
        id="localbusiness-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
    </>
  )
}
