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
    <div className="flex flex-wrap gap-3 items-center p-4 bg-primary/5 rounded-xl border border-primary/20">
      <div className="flex items-center gap-2 mr-4">
        <Send className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold uppercase tracking-wider text-primary">Pruebas Evolution API</span>
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => handleSendTest("admin")}
        disabled={isPending}
        className="gap-2 bg-background border-primary/30 hover:border-primary"
      >
        <ShieldCheck className="w-4 h-4" /> Administrador
      </Button>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => handleSendTest("musician")}
        disabled={isPending}
        className="gap-2 bg-background border-primary/30 hover:border-primary"
      >
        <Users className="w-4 h-4" /> Músico
      </Button>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => handleSendTest("client")}
        disabled={isPending}
        className="gap-2 bg-background border-primary/30 hover:border-primary"
      >
        <User className="w-4 h-4" /> Cliente
      </Button>

      {isPending && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
      
      <p className="text-[10px] text-muted-foreground ml-auto uppercase tracking-widest font-bold">
        * Mensajes automáticos de prueba
      </p>
    </div>
  )
}
