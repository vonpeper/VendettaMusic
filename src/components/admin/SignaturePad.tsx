"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Eraser, Check, Maximize2, Minimize2, MousePointer2 } from "lucide-react"

interface SignaturePadProps {
  onSave: (signature: string) => void
  placeholder?: string
}

export function SignaturePad({ onSave, placeholder = "Firma aquí" }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasSignature, setHasSignature] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const isDrawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    // RESET CANVAS COMPLETELY
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    
    if (width === 0 || height === 0) return

    // NO DPR SCALING - 1:1 CSS Pixels for maximum positional stability
    canvas.width = width
    canvas.height = height
    
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#E91E63"
    ctx.lineWidth = 3
    
    ctxRef.current = ctx
  }, [])

  useEffect(() => {
    const timer = setTimeout(setupCanvas, 1000)
    window.addEventListener("resize", setupCanvas)
    window.addEventListener("orientationchange", setupCanvas)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", setupCanvas)
      window.removeEventListener("orientationchange", setupCanvas)
    }
  }, [setupCanvas, isFullScreen])

  // NATIVE EVENT HANDLERS FOR MAXIMUM CONTROL
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const getPos = (e: Touch | PointerEvent | MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }

    const onStart = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return
      isDrawing.current = true
      const pos = getPos(e)
      lastPoint.current = pos
      
      const ctx = ctxRef.current
      if (ctx) {
        ctx.beginPath()
        ctx.moveTo(pos.x, pos.y)
      }
      
      canvas.setPointerCapture(e.pointerId)
      e.preventDefault()
    }

    const onMove = (e: PointerEvent) => {
      if (!isDrawing.current || !lastPoint.current) return
      
      const ctx = ctxRef.current
      if (!ctx) return

      const drawPoint = (pos: { x: number; y: number }) => {
        if (!lastPoint.current) return
        ctx.beginPath()
        ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
        lastPoint.current = pos
        setHasSignature(true)
      }

      // Use coalesced events if available for smooth high-frequency tracking
      if ((e as any).getCoalescedEvents) {
        const events = (e as any).getCoalescedEvents() as PointerEvent[]
        for (const ev of events) {
          drawPoint(getPos(ev))
        }
      } else {
        drawPoint(getPos(e))
      }
      
      e.preventDefault()
    }

    const onEnd = (e: PointerEvent) => {
      isDrawing.current = false
      lastPoint.current = null
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId)
      }
      e.preventDefault()
    }

    canvas.addEventListener("pointerdown", onStart, { passive: false })
    canvas.addEventListener("pointermove", onMove, { passive: false })
    canvas.addEventListener("pointerup", onEnd, { passive: false })
    canvas.addEventListener("pointercancel", onEnd, { passive: false })

    return () => {
      canvas.removeEventListener("pointerdown", onStart)
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerup", onEnd)
      canvas.removeEventListener("pointercancel", onEnd)
    }
  }, [])

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const save = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL("image/png")
    onSave(dataUrl)
  }

  return (
    <div className={`space-y-4 ${isFullScreen ? "fixed inset-0 z-[9999] bg-black p-4 flex flex-col" : ""}`}>
      <div 
        className={`relative bg-[#050505] border-2 border-white/5 rounded-[2rem] overflow-hidden shadow-2xl transition-all ${
          isFullScreen ? "flex-1" : "aspect-[2/1] sm:aspect-[3/1] min-h-[350px]"
        }`}
        style={{ touchAction: "none" }}
      >
        <button
          type="button"
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="absolute top-6 right-6 z-10 w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 active:scale-95 transition-all shadow-xl backdrop-blur-md"
        >
          {isFullScreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
        </button>

        {!hasSignature && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-white/5 gap-6 select-none">
            <MousePointer2 className="w-16 h-16 opacity-10 animate-pulse" />
            <div className="text-center">
              <span className="font-black uppercase tracking-[0.6em] text-[10px] block mb-2">{placeholder}</span>
              <span className="text-[9px] font-medium opacity-30 italic">Trazo directo 1:1 activo</span>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-crosshair"
          style={{ touchAction: "none" }}
        />
      </div>
      
      <div className={`flex gap-4 justify-end ${isFullScreen ? "pb-4" : ""}`}>
        <Button 
          variant="outline" 
          size="lg" 
          type="button"
          onClick={clear}
          className="border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 rounded-[1.25rem] px-10 h-16 text-xs font-black uppercase tracking-widest transition-all"
        >
          Limpiar
        </Button>
        <Button 
          size="lg" 
          type="button"
          onClick={save}
          disabled={!hasSignature}
          className="bg-[#E91E63] hover:bg-[#D81B60] text-white font-black uppercase tracking-[0.25em] rounded-[1.25rem] px-12 h-16 shadow-2xl shadow-pink-500/20 active:scale-95 transition-all disabled:opacity-20"
        >
          Guardar Firma
        </Button>
      </div>
    </div>
  )
}
