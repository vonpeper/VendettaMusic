"use client"

import { useEffect, useState } from "react"

export function NeonBorder() {
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = scrolled / maxScroll
      // Aparece sutilmente después de los primeros 100px
      setOpacity(Math.min(scrolled / 500, 0.4))
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[60] transition-opacity duration-500"
      style={{ 
        opacity,
        boxShadow: "inset 0 0 100px rgba(220, 38, 38, 0.3), inset 0 0 20px rgba(220, 38, 38, 0.5)"
      }}
    >
      <div className="absolute inset-0 border-[2px] border-primary/20 animate-pulse" />
    </div>
  )
}
