"use client"

import { Music, Star, Zap, Circle } from "lucide-react"
import { useEffect, useState } from "react"

export function PartyBubbles() {
  const [elements, setElements] = useState<{ id: number; left: string; top: string; size: number; duration: number; delay: number; iconId: number }[]>([])

  useEffect(() => {
    const newElements = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 40 + 20,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
      iconId: Math.floor(Math.random() * 4)
    }))
    setElements(newElements)
  }, [])

  const icons = [Music, Star, Zap, Circle]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bubble-float {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.1; }
          100% { transform: translateY(-300px) rotate(360deg); opacity: 0; }
        }
        .bubble {
          animation: bubble-float linear infinite;
        }
      `}} />
      {elements.map((el) => {
        const Icon = icons[el.iconId]
        return (
          <div
            key={el.id}
            className="bubble absolute"
            style={{
              left: el.left,
              top: el.top,
              width: el.size,
              height: el.size,
              animationDuration: `${el.duration}s`,
              animationDelay: `${el.delay}s`,
            }}
          >
            <Icon className="w-full h-full text-primary/20 rotate-12" />
          </div>
        )
      })}
    </div>
  )
}
