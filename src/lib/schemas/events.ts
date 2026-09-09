import { z } from "zod"

export const saveUnifiedEventQuoteSchema = z.object({
  mode: z.enum(["create", "edit"]).default("create"),
  targetId: z.string().optional(),
  clientId: z.string().nullable().optional(),
  clientName: z.string().min(2, "El nombre del cliente debe tener al menos 2 caracteres").max(100),
  clientPhone: z.string().nullable().optional(),
  clientEmail: z.string().email("Correo electrónico inválido").nullable().optional().or(z.literal("")),
  clientCity: z.string().nullable().optional(),

  customName: z.string().nullable().optional(),
  ceremonyType: z.string().nullable().optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)"),
  additionalDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)")).default([]),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  arrivalTime: z.string().nullable().optional(),
  setupTime: z.string().nullable().optional(),
  guestCount: z.number().int().min(0).default(0),
  dressCode: z.string().nullable().optional(),
  status: z.enum(["pendiente", "agendado", "completado", "cancelado"]).default("pendiente"),
  musicianNotes: z.string().nullable().optional(),
  audioEngineer: z.string().nullable().optional(),

  locationId: z.string().nullable().optional(),
  venueName: z.string().nullable().optional(),
  venueAddress: z.string().nullable().optional(),
  venueCity: z.string().nullable().optional(),
  venueState: z.string().nullable().optional(),
  mapsLink: z.string().nullable().optional(),

  packageId: z.string().nullable().optional(),
  packageName: z.string().nullable().optional(),
  basePrice: z.number().min(0, "El precio base no puede ser negativo"),
  viaticosAmount: z.number().min(0).nullable().optional(),
  discountAmount: z.number().min(0).nullable().optional(),
  additionalItems: z.array(z.object({
    id: z.string().optional(),
    description: z.string().min(1, "La descripción del concepto adicional es requerida"),
    quantity: z.number().int().min(1).default(1),
    unitCost: z.number().min(0).default(0),
    order: z.number().int().default(0)
  })).default([]),
  invoice: z.boolean().default(false),
  depositAmount: z.number().min(0).nullable().optional(),
  originInquiryId: z.string().nullable().optional(),
})

export type SaveUnifiedEventQuotePayload = z.infer<typeof saveUnifiedEventQuoteSchema>
