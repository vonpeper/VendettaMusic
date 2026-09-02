'use client'

import { useState, useEffect } from 'react'
import { Download, Share, PlusSquare, X, Smartphone, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AgendaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState<boolean>(false)
  const [isStandalone, setIsStandalone] = useState<boolean>(false)
  const [showPrompt, setShowPrompt] = useState<boolean>(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if already installed / standalone
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')

    setIsStandalone(standalone)
    if (standalone) return

    // Check if dismissed recently
    const dismissed = localStorage.getItem('vendetta_install_dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 1000 * 60 * 60 * 24 * 3) {
      return
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isAppleDevice)

    // Android / Desktop beforeinstallprompt handler
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // On iOS Safari, show after 1.5 seconds if not standalone
    if (isAppleDevice && !standalone) {
      const timer = setTimeout(() => setShowPrompt(true), 1500)
      return () => clearTimeout(timer)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }

    if (!deferredPrompt) {
      setShowIOSInstructions(true)
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setShowIOSInstructions(false)
    localStorage.setItem('vendetta_install_dismissed', Date.now().toString())
  }

  if (isStandalone || !showPrompt) return null

  return (
    <div className='relative my-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950/40 via-zinc-900/90 to-black border border-primary/40 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-start gap-3.5'>
          <div className='w-11 h-11 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0 mt-0.5'>
            <Smartphone className='w-5 h-5' />
          </div>
          <div>
            <div className='inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary mb-0.5'>
              📲 App de la Banda
            </div>
            <h4 className='text-sm sm:text-base font-bold text-white leading-tight'>
              Instala la Agenda en tu Celular
            </h4>
            <p className='text-xs text-muted-foreground mt-0.5 max-w-md leading-relaxed'>
              Ten acceso directo a tus shows desde tu pantalla de inicio y recibe recordatorios en vivo.
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className='text-muted-foreground hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0'
        >
          <X className='w-4 h-4' />
        </button>
      </div>

      <div className='mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2.5'>
        <Button
          size='sm'
          onClick={handleInstallClick}
          className='bg-primary hover:bg-primary/90 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-lg shadow-primary/20 cursor-pointer flex items-center gap-1.5'
        >
          <Download className='w-3.5 h-3.5' />
          {isIOS ? '¿Cómo Instalar en iPhone?' : 'Instalar App Ahora'}
        </Button>
        <button
          onClick={handleDismiss}
          className='text-xs text-muted-foreground hover:text-white px-2 py-1.5 transition-colors'
        >
          Más tarde
        </button>
      </div>

      {/* iOS Step-by-step Modal / Tooltip */}
      {showIOSInstructions && (
        <div className='mt-4 p-3.5 rounded-xl bg-black/80 border border-white/15 text-xs space-y-2 animate-in fade-in duration-200'>
          <p className='font-bold text-white flex items-center gap-1.5 text-xs text-primary'>
            🍎 Pasos para instalar en iPhone (Safari):
          </p>
          <ol className='space-y-1.5 text-gray-300 pl-1 text-[11px] list-decimal list-inside'>
            <li>
              Toca el botón <strong className='text-white inline-flex items-center gap-1'><Share className='w-3 h-3 text-primary inline' /> Compartir</strong> (abajo al centro en Safari).
            </li>
            <li>
              Baja y selecciona <strong className='text-white inline-flex items-center gap-1'><PlusSquare className='w-3 h-3 text-primary inline' /> Agregar a pantalla de inicio</strong>.
            </li>
            <li>
              Toca <strong className='text-white'>Agregar</strong> arriba a la derecha. ¡Listo!
            </li>
          </ol>
        </div>
      )}
    </div>
  )
}
