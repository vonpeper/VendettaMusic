// src/lib/vehicles.ts

/**
 * Perfiles de vehículos para cálculo de viáticos.
 * Cada perfil incluye consumo de combustible en litros por 100 km.
 */
export const VEHICLE_PROFILES: Record<string, { litersPer100km: number }> = {
  // Escape 2014 – consumo estimado 10 L/100km
  escape_2014: { litersPer100km: 10 },
  // Suzuki 2018 – consumo estimado 8 L/100km
  suzuki_2018: { litersPer100km: 8 },
  // Añadir más perfiles según flota
};
