"use client"

import React, { useEffect, useRef, useState, ComponentType } from "react"
import dynamic from "next/dynamic"

/**
 * Wrapper de intersección para montar componentes diferidos únicamente cuando el
 * usuario hace scroll hacia ellos (con rootMargin para anticipar la carga).
 * Poda más de 1,200 nodos DOM del árbol inicial en dispositivos móviles.
 */
function withLazyScrollMount<P extends object>(
  DynamicComponent: ComponentType<P>,
  minHeight = "400px",
  rootMargin = "350px"
) {
  return function LazyScrollMountedComponent(props: P) {
    const [isVisible, setIsVisible] = useState(false)
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
      if (isVisible) return
      const el = containerRef.current
      if (!el) return

      if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
        setIsVisible(true)
        return
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry && entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        },
        { rootMargin }
      )

      observer.observe(el)
      return () => observer.disconnect()
    }, [isVisible])

    return (
      <div 
        ref={containerRef} 
        style={!isVisible ? { minHeight, contentVisibility: "auto", containIntrinsicSize: `1px ${minHeight}` } : undefined}
      >
        {isVisible ? <DynamicComponent {...props} /> : null}
      </div>
    )
  }
}

// 1. Componentes Fijos de UI (se cargan diferidos pero sin scroll wrapper)
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

// 2. Componentes Pesados en Flujo de Página con Lazy Scroll Mount
const DynamicVinylShowcase = dynamic(
  () => import("@/components/public/VinylShowcase").then((mod) => mod.VinylShowcase),
  { ssr: false }
)

const DynamicAutographWall = dynamic(
  () => import("@/components/public/AutographWall").then((mod) => mod.AutographWall),
  { ssr: false }
)

const DynamicInstagramReelsSection = dynamic(
  () => import("@/components/public/InstagramReelsSection").then((mod) => mod.InstagramReelsSection),
  { ssr: false }
)

const DynamicPhotoGallery = dynamic(
  () => import("@/components/public/PhotoGallery").then((mod) => mod.PhotoGallery),
  { ssr: false }
)

const DynamicVendettaExperience = dynamic(
  () => import("@/components/public/VendettaExperience").then((mod) => mod.VendettaExperience),
  { ssr: false }
)

export const VinylShowcase = withLazyScrollMount(DynamicVinylShowcase, "450px")
export const AutographWall = withLazyScrollMount(DynamicAutographWall, "500px")
export const InstagramReelsSection = withLazyScrollMount(DynamicInstagramReelsSection, "450px")
export const PhotoGallery = withLazyScrollMount(DynamicPhotoGallery, "500px")
export const VendettaExperience = withLazyScrollMount(DynamicVendettaExperience, "400px")
