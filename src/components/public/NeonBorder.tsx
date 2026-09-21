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
