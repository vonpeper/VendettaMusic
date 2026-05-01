import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  // No tiramos en build; sólo cuando el server intenta usarlo.
  // Las rutas que llamen a `stripe` lo validan en runtime.
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_unset", {
  apiVersion: "2025-09-30.acacia" as any,
  typescript: true,
})

export { getAppUrl } from "./url"

/** Convierte MXN (Float) a la unidad mínima que espera Stripe (centavos). */
export function toStripeAmount(mxn: number): number {
  return Math.round(mxn * 100)
}
