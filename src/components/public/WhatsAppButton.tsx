"use client"

import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon"

interface WhatsAppButtonProps {
  phoneNumber?: string
}

export function WhatsAppButton(_props: WhatsAppButtonProps = {}) {
  // Desactivado intencionalmente: Todo el flujo de prospectos se canaliza a través
  // del cotizador (/cotizar) para evitar consultas manuales y estructurar la información.
  return null
}
