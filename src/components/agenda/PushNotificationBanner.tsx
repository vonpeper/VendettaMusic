"use client"

import { useState, useEffect } from "react"
import { Bell, BellRing, Check, Sparkles, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const VAPID_PUBLIC_KEY = "BNed5hz80wadrpiAoeOqHQ5SWOa5Fgw_OJepWU8zomvD9HLPObjZGM_oc4L219jhAicmbUiG4dgct3gRCm24R-U"

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

export function PushNotificationBanner() {
  const [isSupported, setIsSupported] = useState<boolean>(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false)
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false)

  // Auto-register service worker & sync subscription if already granted
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator) {
      setIsSupported(true)
      setPermission(Notification.permission)

      if (Notification.permission === "granted") {
        setIsSubscribed(true)
        // Background sync subscription to server
        syncSubscription().catch(() => {})
      }
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js?v=3")
      await reg.update().catch(() => {})
      await navigator.serviceWorker.ready
      return reg
    } catch (err) {
      console.error("Service worker registration error:", err)
      return null
    }
  }

  const syncSubscription = async () => {
    try {
      const reg = await registerServiceWorker()
      if (!reg || !reg.pushManager) return null

      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        const key = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key
        })
      }

      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON() })
        })
      }
      return sub
    } catch (err) {
      console.warn("Sync subscription error:", err)
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
      setPermission(result)

      if (result !== "granted") {
        toast.error("Permiso denegado. Habilítalo en los ajustes de tu navegador o PWA.")
        setIsSubscribing(false)
        return
      }

      // 2. Register and subscribe with VAPID key
      const pushSubscription = await syncSubscription()

      // 3. Show local test notification
      const reg = await navigator.serviceWorker.ready
      if (reg && reg.showNotification) {
        reg.showNotification("⚡ VENDETTA MUSIC", {
          body: "🔔 ¡Recordatorios activados! Recibirás avisos de shows y llamados directamente en tu pantalla.",
          icon: "/images/logo-icon.png",
          badge: "/images/logo-icon.png",
          data: { url: "/agenda" }
        } as any)
      }

      setIsSubscribed(true)
      toast.success("¡Notificaciones de shows activadas exitosamente!")
    } catch (err: any) {
      console.error("Subscription error:", err)
      toast.error(`Error al activar: ${err?.message || "Desconocido"}`)
    } finally {
      setIsSubscribing(false)
    }
  }

  const handleSendTest = async () => {
    setIsSubscribing(true)
    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        toast.error("Tu navegador no soporta notificaciones")
        setIsSubscribing(false)
        return
      }

      if (Notification.permission !== "granted") {
        const perm = await Notification.requestPermission()
        setPermission(perm)
        if (perm !== "granted") {
          toast.error("Permiso denegado. Habilítalo en los Ajustes de tu teléfono.")
          setIsSubscribing(false)
          return
        }
      }

      // 1. Re-sincronizar suscripción VAPID con el servidor
      const sub = await syncSubscription()

      // 2. Disparar notificación directa por Service Worker local
      let reg = await navigator.serviceWorker.getRegistration()
      if (!reg) {
        reg = await navigator.serviceWorker.register("/sw.js")
        await navigator.serviceWorker.ready
      }

      if (reg && reg.showNotification) {
        await reg.showNotification("⚡ VENDETTA | ¡HOY HAY SHOW!", {
          body: "🎸 Show Vendetta — 21:00 hrs. Montaje: 18:00 hrs. Toca para ver la agenda.",
          icon: "/images/branding/logo-vendetta.png",
          badge: "/images/branding/logo-vendetta.png",
          vibrate: [200, 100, 200, 100, 200],
          tag: "vendetta-show-test-" + Date.now(),
          renotify: true,
          data: { url: "/agenda" }
        } as any)
      }

      // 3. Disparar push desde el servidor
      await fetch("/api/push/send-reminder?test=true").catch(() => {})

      setIsSubscribed(true)
      toast.success("¡Notificación de prueba enviada a tu pantalla!")
    } catch (err: any) {
      console.error("Test notification error:", err)
      toast.error(`Error al enviar prueba: ${err?.message || "Desconocido"}`)
    } finally {
      setIsSubscribing(false)
    }
  }

  if (!isSupported) return null

  return (
    <div className="bg-gradient-to-r from-zinc-950 via-purple-950/20 to-black border border-purple-500/30 rounded-3xl p-4 sm:p-5 shadow-xl backdrop-blur-xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            {isSubscribed ? <BellRing className="w-5 h-5 text-emerald-400" /> : <Bell className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-heading font-black text-white uppercase tracking-tight">
                Recordatorios de Shows
              </h4>
              {isSubscribed && (
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <Check className="w-2.5 h-2.5" /> Activadas
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-lg leading-relaxed">
              {isSubscribed
                ? "Dispositivo vinculado. Recibirás avisos de shows, montajes y llamados en tu pantalla."
                : "Activa las alertas push para recibir recordatorios en tu teléfono el día de cada presentación."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Button
            size="sm"
            onClick={handleSendTest}
            disabled={isSubscribing}
            className={
              isSubscribed
                ? "border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 font-bold text-xs gap-1.5 h-10 px-4 rounded-xl cursor-pointer w-full sm:w-auto transition-all"
                : "bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider gap-2 h-10 px-5 rounded-xl shadow-lg shadow-purple-600/20 cursor-pointer w-full sm:w-auto transition-all"
            }
          >
            {isSubscribing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...
              </>
            ) : isSubscribed ? (
              <>
                <Send className="w-3.5 h-3.5 text-purple-400" /> Probar Notificación
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Activar Notificaciones
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
