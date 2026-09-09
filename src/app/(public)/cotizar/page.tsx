import { redirect } from "next/navigation"

export const metadata = {
  title: "Cotiza tu Evento | Vendetta",
  description: "Conoce nuestros paquetes y cotiza tu evento directamente por WhatsApp."
}

export default function CotizarPage() {
  redirect("/#paquetes")
}
