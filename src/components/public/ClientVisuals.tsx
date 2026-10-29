"use client"

import dynamic from "next/dynamic"

/**
 * Componentes cosméticos, interactivos y animaciones pesadas de Framer Motion
 * cargados de forma diferida (ssr: false) para eliminar el bloqueo de CPU
 * y reducir drásticamente el peso del HTML inicial de la portada pública.
 */

export const ConcertAtmosphere = dynamic(
  () => import("@/components/public/ConcertAtmosphere").then((mod) => mod.ConcertAtmosphere),
  { ssr: false }
)

export const NeonBorder = dynamic(
  () => import("@/components/public/NeonBorder").then((mod) => mod.NeonBorder),
  { ssr: false }
)

export const WhatsAppButton = dynamic(
  () => import("@/components/public/WhatsAppButton").then((mod) => mod.WhatsAppButton),
  { ssr: false }
)

export const VinylShowcase = dynamic(
  () => import("@/components/public/VinylShowcase").then((mod) => mod.VinylShowcase),
  { ssr: false }
)

export const AutographWall = dynamic(
  () => import("@/components/public/AutographWall").then((mod) => mod.AutographWall),
  { ssr: false }
)

export const InstagramReelsSection = dynamic(
  () => import("@/components/public/InstagramReelsSection").then((mod) => mod.InstagramReelsSection),
  { ssr: false }
)

export const PhotoGallery = dynamic(
  () => import("@/components/public/PhotoGallery").then((mod) => mod.PhotoGallery),
  { ssr: false }
)

export const VendettaExperience = dynamic(
  () => import("@/components/public/VendettaExperience").then((mod) => mod.VendettaExperience),
  { ssr: false }
)
