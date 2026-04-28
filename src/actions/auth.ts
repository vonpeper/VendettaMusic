"use server"

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

// --- 🛡️ IN-MEMORY RATE LIMITER (Brute Force Protection) ---
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 minutos

export async function loginAction(prevState: any, formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    
    // 1. Rate Limiting Check
    const now = Date.now()
    const record = loginAttempts.get(email)

    if (record) {
      if (now - record.firstAttempt < LOCKOUT_MS) {
        if (record.count >= MAX_ATTEMPTS) {
          console.warn(`🛑 Bloqueo de seguridad (Fuerza Bruta) para: ${email}`)
          return { success: false, message: "Demasiados intentos fallidos. Por seguridad, tu cuenta ha sido bloqueada temporalmente. Intenta nuevamente en 15 minutos." }
        }
      } else {
        // Reset after lockout period expires
        loginAttempts.set(email, { count: 0, firstAttempt: now })
      }
    } else {
      loginAttempts.set(email, { count: 0, firstAttempt: now })
    }

    console.log("🔥 Intento de login POST recibido para:", email)

    await signIn("credentials", { 
      email, 
      password, 
      redirectTo: "/admin" 
    })
    
    // Si llegamos aquí, el login fue exitoso. Limpiamos el historial.
    loginAttempts.delete(email)
    
    return { success: true, message: "Inicio de sesión exitoso" }
  } catch (error) {
    console.error("🔥 ERROR EN SIGNIN:", error)

    // Registrar intento fallido
    const email = formData.get("email") as string
    if (email) {
      const record = loginAttempts.get(email)
      if (record) {
        record.count += 1
        loginAttempts.set(email, record)
      }
    }

    if (error && typeof error === "object" && "type" in error) {
      if (error.type === "CredentialsSignin") {
        return { success: false, message: "Credenciales inválidas. Verifica tu correo y contraseña." }
      }
    }
    // Next.js redirect lanza un error internamente, lo re-lanzamos para que la redirección funcione
    throw error
  }
}

