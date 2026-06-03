import { verifyJWT, MobileSessionPayload } from "./jwt"

export async function getMobileUser(req: Request): Promise<MobileSessionPayload | null> {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }
    const token = authHeader.split(" ")[1]
    return await verifyJWT(token)
  } catch (error) {
    return null
  }
}
