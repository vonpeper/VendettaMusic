"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("⚠️ Error capturado por AdminError boundary:", error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border/60 rounded-3xl p-8 text-center shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold font-heading text-foreground">
            No se pudo cargar la sección
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Esto puede ocurrir si se completó un nuevo despliegue en el servidor o se perdió la conexión momentáneamente.
          </p>
          {error?.message && (
            <div className="text-[11px] font-mono bg-muted/50 p-2.5 rounded-xl text-muted-foreground break-all text-left mt-3 max-h-24 overflow-y-auto">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            onClick={() => reset()}
            variant="default"
            className="bg-primary hover:bg-primary/90 text-white font-bold gap-2 rounded-xl h-11"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </Button>

          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-border/60 font-bold gap-2 rounded-xl h-11"
          >
            Recargar Página
          </Button>
        </div>

        <div className="pt-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Volver al Inicio del Administrador
          </Link>
        </div>
      </div>
    </div>
  )
}
