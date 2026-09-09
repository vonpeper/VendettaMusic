import { z } from "zod"

export const contactSchema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio").max(100),
  telefono: z.string().min(8, "Ingresa un teléfono válido").max(25),
  email: z.string().email("Ingresa un correo válido").max(100),
  fecha: z.string().optional(),
  tipo: z.string().optional(),
  mensaje: z.string().optional(),
})

export type ContactPayload = z.infer<typeof contactSchema>
