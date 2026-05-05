"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Send, User, ShieldCheck, Users, Loader2 } from "lucide-react"
import { sendTestNotificationAction } from "@/actions/notifications"
import { toast } from "sonner"

export function TestNotificationButtons() {
  const [isPending, startTransition] = useTransition()

  const handleSendTest = (target: "admin" | "musician" | "client") => {
    startTransition(async () => {
      const res = await sendTestNotificationAction(target)
      if (res.success) {
        toast.success(`Mensaje enviado con éxito a ${target}`)
      } else {
        toast.error(`Error: ${res.error || "No se pudo enviar el mensaje"}`)
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-4 items-center p-6 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm">
      <div className="flex items-center gap-3 mr-6">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
          <Send className="w-5 h-5 text-primary" />
        </div>
        <div>
          <span className="text-sm font-black uppercase tracking-[0.1em] text-primary block">Evolution API</span>
          <span className="text-[10px] text-muted-foreground font-bold uppercase">Pruebas de Envío Automático</span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => handleSendTest("admin")}
          disabled={isPending}
          className="gap-2 bg-gradient-to-r from-[#E91E63] to-[#D81B60] hover:shadow-lg hover:shadow-pink-500/30 transition-all rounded-xl h-10 px-4 font-bold text-white border-none"
        >
          <ShieldCheck className="w-4 h-4" /> A Administrador
        </Button>

        <Button 
          variant="default" 
          size="sm" 
          onClick={() => handleSendTest("musician")}
          disabled={isPending}
          className="gap-2 bg-gradient-to-r from-[#E91E63] to-[#D81B60] hover:shadow-lg hover:shadow-pink-500/30 transition-all rounded-xl h-10 px-4 font-bold text-white border-none"
        >
          <Users className="w-4 h-4" /> A Músicos
        </Button>

        <Button 
          variant="default" 
          size="sm" 
          onClick={() => handleSendTest("client")}
          disabled={isPending}
          className="gap-2 bg-gradient-to-r from-[#E91E63] to-[#D81B60] hover:shadow-lg hover:shadow-pink-500/30 transition-all rounded-xl h-10 px-4 font-bold text-white border-none"
        >
          <User className="w-4 h-4" /> A Clientes
        </Button>
      </div>

      {isPending && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
      
      <div className="ml-auto flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-full border border-border/20">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black">
          API Conectada
        </p>
      </div>
    </div>
  )
}
