"use client"

import { useState, useEffect } from "react"
import { Bell, BellRing, Check, Sparkles, Loader2, Send, X, ShieldCheck, MapPin, Clock, Shirt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BNed5hz80wadrpiAoeOqHQ5SWOa5Fgw_OJepWU8zomvD9HLPObjZGM_oc4L219jhAicmbUiG4dgct3gRCm24R-U"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushNotificationButton() {
  const [isSupported, setIsSupported] = useState<boolean>(false)
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false)
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  useEffect(() => {
    async function checkSubscription() {
      if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
        return
      }
      setIsSupported(true)

      try {
        const reg = await navigator.serviceWorker.register("/sw.js")
        await navigator.serviceWorker.ready
        const existingSub = await reg.pushManager.getSubscription()

        if (existingSub) {
          setIsSubscribed(true)
          // Ensure the server has this subscription in SQLite
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscription: existingSub.toJSON() })
          }).catch(() => null)
        } else if (Notification.permission === "granted") {
          // If browser has permission granted, auto-create subscription with VAPID key for Android/iOS
          try {
            const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            const newSub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey
            })
            if (newSub) {
              await fetch("/api/push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscription: newSub.toJSON() })
              }).catch(() => null)
              setIsSubscribed(true)
            }
          } catch (autoErr) {
            console.warn("Auto-subscribe on mount failed:", autoErr)
            setIsSubscribed(false)
          }
        } else {
          setIsSubscribed(false)
        }
      } catch (err) {
        console.error("Error checking subscription:", err)
      }
    }

    checkSubscription()
  }, [])

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready
      return reg
    } catch (err) {
      console.error("Service worker registration error:", err)
      return null
    }
  }

  const handleSubscribe = async () => {
    if (!isSupported) {
      toast.error("Tu navegador no soporta notificaciones push")
      return
    }

    setIsSubscribing(true)

    try {
      // 1. Request permission
      const result = await Notification.requestPermission()

      if (result !== "granted") {
        toast.error("Permiso de notificaciones denegado. Habilítalo en los ajustes de tu navegador.")
        setIsSubscribing(false)
        return
      }

      // 2. Register Service Worker
      const reg = await registerServiceWorker()
      if (!reg) {
        toast.error("No se pudo iniciar el servicio de notificaciones")
        setIsSubscribing(false)
        return
      }

      // 3. Subscribe with pushManager (providing VAPID key for Android / Chrome / iOS)
      let pushSubscription = null
      if (reg.pushManager) {
        try {
          pushSubscription = await reg.pushManager.getSubscription()
          if (!pushSubscription) {
            const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            pushSubscription = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey,
            })
          }
        } catch (e) {
          console.error("PushManager subscribe error:", e)
        }
      }

      // 4. Send subscription to server if available
      if (pushSubscription) {
        const subJSON = pushSubscription.toJSON()
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: subJSON })
        }).catch(err => console.error("Error sending subscription to server:", err))
      }

      setIsSubscribed(true)
      toast.success("¡Recordatorios de shows activados exitosamente!")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Desconocido"
      console.error("Subscription error:", err)
      toast.error(`Error al activar: ${msg}`)
    } finally {
      setIsSubscribing(false)
    }
  }

  const handleSendTest = async () => {
    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        toast.error("Tu navegador no soporta notificaciones")
        return
      }

      if (Notification.permission !== "granted") {
        const perm = await Notification.requestPermission()
        if (perm !== "granted") {
          toast.error("Por favor concede permiso de notificaciones en tu navegador.")
          return
        }
      }

      // Disparar prueba directamente desde el servidor (WebPush real hacia FCM / APNs)
      const res = await fetch("/api/push/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success("¡Notificación push real enviada desde el servidor a tu dispositivo!")
      } else {
        // Respaldo con notificación local si la llamada al servidor no entregó
        const reg = await navigator.serviceWorker.ready
        if (reg?.showNotification) {
          await reg.showNotification("⚡ VENDETTA | ¡HOY HAY SHOW!", {
            body: "🎸 Boda Mariana & Carlos — Show 21:00 hrs en Hacienda San José. Llamado 18:30 hrs.",
            icon: "/icon.png",
            badge: "/icon.png",
            vibrate: [200, 100, 200, 100, 200],
            tag: "vendetta-show-demo",
            renotify: true,
            data: { url: "/agenda" }
          } as NotificationOptions)
        }
        toast.info("Prueba enviada a tu pantalla")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Desconocido"
      console.error("Test notification error:", err)
      toast.error(`Error al enviar prueba: ${msg}`)
    }
  }

  if (!isSupported) return null

  return (
    <>
      {/* Compact Trigger Button */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        title={isSubscribed ? "Notificaciones activadas (Click para configurar)" : "Activar recordatorios de shows"}
        className={`relative inline-flex items-center gap-2 h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${
          isSubscribed
            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 hover:border-emerald-400"
            : "bg-purple-950/30 border-purple-500/40 text-purple-300 hover:bg-purple-900/50 hover:border-purple-400"
        }`}
      >
        {isSubscribed ? (
          <BellRing className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : (
          <Bell className="w-4 h-4 text-purple-400 shrink-0" />
        )}
        
        <span className="hidden sm:inline">
          {isSubscribed ? "Alertas ON" : "Alertas"}
        </span>

        {/* Status Indicator Dot */}
        <span className="relative flex h-2 w-2">
          {isSubscribed ? (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          ) : (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
            </>
          )}
        </span>
      </button>

      {/* Pop-up Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Dialog Content - Compact & High-Impact (Fits all mobile screens without scrolling) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-sm sm:max-w-md bg-zinc-950/95 border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl z-10 space-y-4 my-auto backdrop-blur-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                    isSubscribed 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                      : "bg-purple-500/10 border-purple-500/30 text-purple-400"
                  }`}>
                    {isSubscribed ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-heading font-black text-white uppercase tracking-tight">
                      Alertas de Shows
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {isSubscribed ? "Notificaciones push activas" : "Recordatorios push para la banda"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status / Benefits Card */}
              {isSubscribed ? (
                <div className="p-3.5 rounded-2xl border bg-emerald-950/30 border-emerald-500/30 text-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Dispositivo Vinculado
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <Check className="w-2.5 h-2.5" /> Activo
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Recibirás una alerta en tu pantalla la mañana de cada show con tus horarios de llamado, locación y código de vestimenta.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl border bg-white/[0.03] border-white/10 space-y-2.5">
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Activa los avisos para recibir notificaciones automáticas en la pantalla de tu teléfono el día de cada presentación:
                  </p>

                  {/* Compact Feature Pills */}
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-200">
                      <Clock className="w-3 h-3 text-primary" /> Horarios de llamado
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-200">
                      <MapPin className="w-3 h-3 text-blue-400" /> GPS / Waze
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-200">
                      <Shirt className="w-3 h-3 text-indigo-400" /> Vestimenta
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons - Prominent, Thick & High Touch-Area */}
              <div className="pt-1 space-y-2">
                {isSubscribed ? (
                  <Button
                    onClick={handleSendTest}
                    className="w-full h-13 sm:h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm sm:text-base uppercase tracking-wider gap-2 shadow-xl shadow-emerald-600/30 cursor-pointer active:scale-[0.98] transition-all"
                  >
                    <Send className="w-4 h-4" /> Probar Notificación Push
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubscribe}
                    disabled={isSubscribing}
                    className="w-full h-13 sm:h-14 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base uppercase tracking-wider gap-2.5 shadow-xl shadow-purple-600/40 cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isSubscribing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Activando en tu dispositivo...
                      </>
                    ) : (
                      <>
                        <BellRing className="w-5 h-5 shrink-0" /> Activar Notificaciones Push
                      </>
                    )}
                  </Button>
                )}

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-2 text-center text-xs font-bold text-muted-foreground hover:text-white transition-colors cursor-pointer"
                >
                  {isSubscribed ? "Cerrar" : "Ahora no, cerrar"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

// Backwards-compatible alias
export const PushNotificationBanner = PushNotificationButton

