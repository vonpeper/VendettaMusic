"use server"

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

export async function loginAction(prevState: any, formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    
    console.log("🔥 Intento de login POST recibido para:", email)

    await signIn("credentials", { 
      email, 
      password, 
      redirectTo: "/admin" 
    })
    
    return { success: true, message: "Inicio de sesión exitoso" }
  } catch (error) {
    console.error("🔥 ERROR EN SIGNIN:", error)
    if (error && typeof error === "object" && "type" in error) {
      if (error.type === "CredentialsSignin") {
        return { success: false, message: "Credenciales inválidas. Verifica tu correo y contraseña." }
      }
    }
    // Next.js redirect throws an error, so we must re-throw it if it isn't an AuthError
    throw error
  }
}
