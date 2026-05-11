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
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 3
    
    ctxRef.current = ctx
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const observer = new ResizeObserver(() => {
      // Small delay to ensure browser has finished layout
      requestAnimationFrame(setupCanvas)
    })

    observer.observe(canvas.parentElement || canvas)
    
    // Fallback for initial load
    const timer = setTimeout(setupCanvas, 100)
    
    window.addEventListener("resize", setupCanvas)
    window.addEventListener("orientationchange", setupCanvas)
    
    return () => {
      observer.disconnect()
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
    <div className={`space-y-4 ${isFullScreen ? "fixed inset-0 z-[9999] bg-white p-4 flex flex-col" : "relative"}`}>
      <div 
        className={`relative border-2 border-border/40 rounded-[2rem] overflow-hidden shadow-inner transition-all ${
          isFullScreen ? "flex-1" : "w-full h-48 sm:h-[350px]"
        }`}
        style={{ touchAction: "none", backgroundColor: '#e5e7eb' }}
      >
        <div className="absolute top-2 right-4 text-[8px] opacity-40 text-foreground z-10 font-black tracking-tighter">v4.5</div>
        <button
          type="button"
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="absolute top-6 right-6 z-10 w-14 h-14 rounded-2xl bg-black/5 border border-black/10 flex items-center justify-center text-black/20 hover:text-black hover:bg-black/10 active:scale-95 transition-all shadow-sm backdrop-blur-md"
        >
          {isFullScreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
        </button>

        {!hasSignature && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-black/5 gap-6 select-none">
            <MousePointer2 className="w-16 h-16 opacity-10 animate-pulse" />
            <div className="text-center">
              <span className="font-black uppercase tracking-[0.6em] text-[10px] block mb-2 text-black/30">{placeholder}</span>
              <span className="text-[9px] font-medium opacity-30 italic text-black/40">Trazo directo 1:1 activo</span>
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
          className="border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted rounded-[1.25rem] px-10 h-16 text-xs font-black uppercase tracking-widest transition-all"
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
