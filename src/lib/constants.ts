export const BookingStatus = {
  LEAD: "lead",
  QUOTED: "quoted",
  SCHEDULED: "scheduled",
  COMPLETED: "completado", // Mantenemos compatibilidad con strings existentes
  CANCELLED: "cancelled"
} as const;

export type BookingStatusType = typeof BookingStatus[keyof typeof BookingStatus];

export const PaymentStatus = {
  NO_DEPOSIT: "no_deposit",
  PENDING: "pending",
  DEPOSIT_PAID: "deposit_paid",
  PAID_IN_FULL: "paid_in_full"
} as const;

export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];

export const ContractStatus = {
  PENDING_GENERATION: "pending_generation",
  SENT: "sent",
  SIGNED: "signed"
} as const;

export type ContractStatusType = typeof ContractStatus[keyof typeof ContractStatus];

export const NotificationStatus = {
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
  MANUAL: "manual"
} as const;

export type NotificationStatusType = typeof NotificationStatus[keyof typeof NotificationStatus];
