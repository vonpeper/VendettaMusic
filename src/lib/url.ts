/**
 * URL pública canónica de la app (sin trailing slash).
 * Usar en redirects, emails, links a status, webhooks externos, etc.
 */
export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://vendetta.mx"
  )
}
