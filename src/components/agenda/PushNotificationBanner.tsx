"use client"

import { useState, useEffect } from "react"
import { Bell, BellRing, Check, Sparkles, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function PushNotificationBanner() {
  const [isSupported, setIsSupported] = useState<boolean>(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false)
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator) {
      setIsSupported(true)
      setPermission(Notification.permission)

      if (Notification.permission === "granted") {
        setIsSubscribed(true)
      }
    }
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
      setPermission(result)

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

      // 3. Try subscribing with pushManager if supported
      let pushSubscription = null
      if (reg.pushManager) {
        try {
          pushSubscription = await reg.pushManager.getSubscription()
          if (!pushSubscription) {
            // Subscribe with standard push
            pushSubscription = await reg.pushManager.subscribe({
              userVisibleOnly: true,
            }).catch(() => null)
          }
        } catch (e) {
          console.log("PushManager subscribe fallback:", e)
        }
      }

      // 4. Send subscription to server if available
      if (pushSubscription) {
        const subJSON = pushSubscription.toJSON()
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: subJSON })
        }).catch(err => console.error("Error sending subscription:", err))
      }

      // 5. Show local confirmation notification
      if (reg.showNotification) {
        reg.showNotification("⚡ VENDETTA MUSIC", {
          body: "🔔 ¡Recordatorios activados! Te avisaremos el día de cada show con tus horarios y locación.",
          icon: "/images/logo-icon.png",
          badge: "/images/logo-icon.png",
          data: { url: "/agenda" }
        })
      }

      setIsSubscribed(true)
      toast.success("¡Recordatorios de shows activados exitosamente!")
    } catch (err: any) {
      console.error("Subscription error:", err)
      toast.error(`Error al activar: ${err?.message || "Desconocido"}`)
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

      let reg = await navigator.serviceWorker.getRegistration()
      if (!reg) {
        reg = await navigator.serviceWorker.register("/sw.js")
        await navigator.serviceWorker.ready
      }

      if (reg && reg.showNotification) {
        await reg.showNotification("⚡ VENDETTA | ¡HOY HAY SHOW!", {
          body: "🎸 Boda Mariana & Carlos — Show 21:00 hrs en Hacienda San José. Llamado 18:30 hrs. Vestimenta: Formal Rock.",
          icon: "/images/branding/logo-vendetta.png",
          badge: "/images/branding/logo-vendetta.png",
          vibrate: [200, 100, 200, 100, 200],
          tag: "vendetta-show-demo",
          renotify: true,
          data: { url: "/agenda" }
        })
        toast.success("¡Notificación de prueba enviada a tu pantalla!")
      } else {
        new Notification("⚡ VENDETTA | ¡HOY HAY SHOW!", {
          body: "🎸 Boda Mariana & Carlos — Show 21:00 hrs en Hacienda San José. Llamado 18:30 hrs.",
          icon: "/images/branding/logo-vendetta.png"
        })
        toast.success("¡Notificación de prueba enviada!")
      }
    } catch (err: any) {
      console.error("Test notification error:", err)
      toast.error(`Error al mostrar notificación: ${err?.message || "Desconocido"}`)
    }
  }

  if (!isSupported) return null

  return (
    <div className="bg-gradient-to-r from-zinc-950 via-purple-950/20 to-black border border-purple-500/30 rounded-3xl p-4 sm:p-5 shadow-xl backdrop-blur-xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            {isSubscribed ? <BellRing className="w-5 h-5 animate-bounce" /> : <Bell className="w-5 h-5" />}
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
                ? "Recibirás una notificación en tu pantalla el día de cada show con tus horarios y locación."
                : "Activa las alertas push para recibir un aviso elegante en tu teléfono el día de cada presentación."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          {isSubscribed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendTest}
              className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs font-bold gap-1.5 h-10 px-4 rounded-xl cursor-pointer w-full sm:w-auto"
            >
              <Send className="w-3.5 h-3.5" /> Probar Notificación
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubscribe}
              disabled={isSubscribing}
              className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider gap-2 h-10 px-5 rounded-xl shadow-lg shadow-purple-600/20 cursor-pointer w-full sm:w-auto transition-all"
            >
              {isSubscribing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Activando...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Activar Notificaciones
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
