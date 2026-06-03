import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback_secret_vendetta_music_app_2026"
)

export interface MobileSessionPayload {
  userId: string
  email: string
  name: string
  role: string
  musicianProfileId?: string
}

export async function signJWT(payload: MobileSessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d") // Token valid for 30 days
    .sign(JWT_SECRET)
}

export async function verifyJWT(token: string): Promise<MobileSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as MobileSessionPayload
  } catch (error) {
    console.error("JWT verification failed:", error)
    return null
  }
}
