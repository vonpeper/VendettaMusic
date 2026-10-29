"use client"

import { useEffect, useState } from "react"

export function NeonBorder() {
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth < 768) return

    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.scrollY
          setOpacity(Math.min(scrolled / 500, 0.4))
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[60] transition-opacity duration-700"
      style={{ 
        opacity,
        boxShadow: "inset 0 0 120px rgba(111, 13, 43, 0.25), inset 0 0 30px rgba(255, 90, 95, 0.15)"
      }}
    >
      <div className="absolute inset-0 border-[1px] border-[#FF5A5F]/20" />
    </div>
  )
}
