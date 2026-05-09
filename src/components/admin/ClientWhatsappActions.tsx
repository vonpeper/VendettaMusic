"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare, Zap, Loader2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { sendAutomatedClientWhatsAppAction } from "@/actions/notifications"

export function ClientWhatsappActions({ 
  bookingId, 
  clientPhone 
}: { 
  bookingId: string
  clientPhone: string 
}) {
  const [loading, setLoading] = useState(false)

  const handleAutomated = async () => {
    setLoading(true)
    try {
      const res = await sendAutomatedClientWhatsAppAction(bookingId)
      if (res.success) toast.success(res.message)
      else toast.error(res.error)
    } catch (err) {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const cleanPhone = clientPhone.replace(/\D/g, "")
  const whatsappLink = `https://wa.me/52${cleanPhone.length === 10 ? cleanPhone : cleanPhone.slice(-10)}`

  return (
    <div className="space-y-2 w-full">
      <Button 
        variant="outline" 
        onClick={handleAutomated}
        disabled={loading}
        className="w-full border-blue-600/40 text-blue-600 hover:bg-blue-600 hover:text-white transition-all rounded-xl h-11 gap-2 font-black uppercase tracking-widest group shadow-sm" 
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Zap className="w-4 h-4" />
        )}
        WhatsApp Auto
      </Button>
      
      <Button 
        variant="outline" 
        asChild
        className="w-full border-green-600/40 text-green-600 hover:bg-green-600 hover:text-white transition-all rounded-xl h-11 gap-2 font-black uppercase tracking-widest group shadow-sm" 
      >
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
          Chatear (Manual) <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100" />
        </a>
      </Button>
    </div>
  )
}
