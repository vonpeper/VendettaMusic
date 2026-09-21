"use client"

import React, { useEffect, useRef, useState } from "react"

export function ConcertAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    if (!isClient) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener("resize", handleResize)

    // Gentle haze/fog particles mimicking stage smoke machines
    const particleCount = 18
    const particles: Array<{
      x: number
      y: number
      radius: number
      vx: number
      vy: number
      alpha: number
      targetAlpha: number
    }> = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 180 + 120,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.3 - 0.1, // gently rises like stage smoke
        alpha: Math.random() * 0.05 + 0.02,
        targetAlpha: Math.random() * 0.07 + 0.03
      })
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy

        // Wrap around boundaries
        if (p.x < -p.radius) p.x = width + p.radius
        if (p.x > width + p.radius) p.x = -p.radius
        if (p.y < -p.radius) p.y = height + p.radius

        // Smoothly draw soft radial gradient smoke blob
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius)
        grad.addColorStop(0, `rgba(255, 90, 95, ${p.alpha * 0.8})`)
        grad.addColorStop(0.5, `rgba(119, 119, 255, ${p.alpha * 0.5})`)
        grad.addColorStop(1, "rgba(7, 8, 13, 0)")

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", handleResize)
    }
  }, [isClient])

  if (!isClient) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden select-none">
      {/* Canvas for Stage Smoke / Haze Machine */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-65 mix-blend-screen"
        aria-hidden="true"
      />

      {/* Dynamic Cursor-Reactive Lens Flare & Anamorphic Streak */}
      {mousePos.x > 0 && mousePos.y > 0 && (
        <div
          className="fixed pointer-events-none transition-transform duration-100 ease-out"
          style={{
            transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)`,
            top: 0,
            left: 0,
          }}
          aria-hidden="true"
        >
          {/* Anamorphic horizontal streak */}
          <div className="absolute -top-0.5 -left-[200px] w-[400px] h-[1px] bg-gradient-to-r from-transparent via-[#FF5A5F]/40 to-transparent blur-[1px]" />
          
          {/* Central stage light flare */}
          <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-gradient-to-r from-[#FF5A5F]/15 via-[#7777FF]/15 to-transparent blur-xl" />
        </div>
      )}

      {/* Subtle periodic stage stroboscopic pulse */}
      <div 
        className="absolute inset-0 bg-white/5 pointer-events-none"
        style={{
          animation: "strobe-flash 12s ease-in-out infinite"
        }}
        aria-hidden="true"
      />
    </div>
  )
}
