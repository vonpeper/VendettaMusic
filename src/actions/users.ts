"use server"

import { db } from "@/lib/db"
import { hash } from "bcryptjs"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function createUserAction(formData: FormData) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    return { success: false, message: "No autorizado" }
  }

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as string || "ADMIN"

  if (!email || !password) {
    return { success: false, message: "Email y contraseña son requeridos" }
  }

  try {
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return { success: false, message: "El usuario ya existe" }
    }

    const hashedPassword = await hash(password, 12)

    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      }
    })

    revalidatePath("/admin/usuarios")
    return { success: true, message: "Usuario creado exitosamente" }
  } catch (error) {
    console.error("Error creating user:", error)
    return { success: false, message: "Error al crear el usuario" }
  }
}

export async function changePasswordAction(formData: FormData) {
  const session = await auth()
  if (!session) {
    return { success: false, message: "No autorizado" }
  }

  const userId = formData.get("userId") as string
  const newPassword = formData.get("password") as string

  // Solo un admin puede cambiar la contraseña de otros. 
  // Un usuario normal solo puede cambiar la suya.
  if (session.user?.role !== "ADMIN" && session.user?.id !== userId) {
    return { success: false, message: "No tienes permiso para realizar esta acción" }
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: "La contraseña debe tener al menos 6 caracteres" }
  }

  try {
    const hashedPassword = await hash(newPassword, 12)

    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    return { success: true, message: "Contraseña actualizada correctamente" }
  } catch (error) {
    console.error("Error changing password:", error)
    return { success: false, message: "Error al cambiar la contraseña" }
  }
}

export async function deleteUserAction(userId: string) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    return { success: false, message: "No autorizado" }
  }

  if (session.user?.id === userId) {
    return { success: false, message: "No puedes eliminar tu propia cuenta" }
  }

  try {
    await db.user.delete({ where: { id: userId } })
    revalidatePath("/admin/usuarios")
    return { success: true, message: "Usuario eliminado" }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { success: false, message: "Error al eliminar el usuario" }
  }
}
