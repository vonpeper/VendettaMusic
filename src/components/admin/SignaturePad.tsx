"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Eraser, Check, Maximize2, Minimize2, MousePointer2 } from "lucide-react"

interface SignaturePadProps {
  onSave: (signature: string) => void
  placeholder?: string
  disabled?: boolean
}

export function SignaturePad({ onSave, placeholder = "Firma aquí", disabled = false }: SignaturePadProps) {
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

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      const pos = getPos(touch as any)
      isDrawing.current = true
      lastPoint.current = pos
      const ctx = ctxRef.current
      if (ctx) {
        ctx.beginPath()
        ctx.moveTo(pos.x, pos.y)
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (!isDrawing.current || !lastPoint.current) return
      const touch = e.touches[0]
      const pos = getPos(touch as any)
      const ctx = ctxRef.current
      if (ctx) {
        ctx.beginPath()
        ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
        lastPoint.current = pos
        setHasSignature(true)
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      isDrawing.current = false
      lastPoint.current = null
    }

    canvas.addEventListener("pointerdown", onStart, { passive: false })
    canvas.addEventListener("pointermove", onMove, { passive: false })
    canvas.addEventListener("pointerup", onEnd, { passive: false })
    canvas.addEventListener("pointercancel", onEnd, { passive: false })
    
    canvas.addEventListener("touchstart", onTouchStart, { passive: false })
    canvas.addEventListener("touchmove", onTouchMove, { passive: false })
    canvas.addEventListener("touchend", onTouchEnd, { passive: false })

    return () => {
      canvas.removeEventListener("pointerdown", onStart)
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerup", onEnd)
      canvas.removeEventListener("pointercancel", onEnd)
      canvas.removeEventListener("touchstart", onTouchStart)
      canvas.removeEventListener("touchmove", onTouchMove)
      canvas.removeEventListener("touchend", onTouchEnd)
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
    <div className="space-y-4 relative">
      <div 
        className="relative border-2 border-slate-300 focus-within:border-red-500 rounded-2xl overflow-hidden shadow-sm transition-all w-full h-64 sm:h-[300px] landscape:h-[160px] bg-white"
        style={{ touchAction: "none" }}
      >
        {!hasSignature && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2 select-none">
            <MousePointer2 className="w-8 h-8 text-slate-300 animate-pulse" />
            <div className="text-center">
              <span className="font-black uppercase tracking-widest text-xs block text-slate-500">{placeholder}</span>
              <span className="text-[11px] font-medium text-slate-400">Trazo digital con tu dedo o puntero</span>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-crosshair bg-white"
          style={{ touchAction: "none" }}
        />
      </div>
      
      <div className="flex justify-center w-full mt-4">
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          <Button 
            variant="outline" 
            size="lg" 
            type="button"
            onClick={clear}
            disabled={disabled}
            className="w-full border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-xl px-4 h-12 text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Eraser className="w-4 h-4 text-slate-500" />
            Limpiar
          </Button>
          <Button 
            size="lg" 
            type="button"
            onClick={() => {
              save();
            }}
            disabled={disabled || !hasSignature}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider rounded-xl px-4 h-12 shadow-md active:scale-95 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {disabled ? "Guardando..." : "Guardar Firma"}
          </Button>
        </div>
      </div>
    </div>
  )
}
