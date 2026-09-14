// src/lib/vehicles.ts

/**
 * Perfiles de vehículos para cálculo de viáticos.
 * Cada perfil incluye consumo de combustible en litros por 100 km.
 */
export const VEHICLE_PROFILES: Record<string, { litersPer100km: number; kmPerLiter: number }> = {
  // Flota Vendetta: Ambas camionetas SUV con rendimiento real de 7.1 km por litro
  escape_2014: { litersPer100km: 100 / 7.1, kmPerLiter: 7.1 },
  suv: { litersPer100km: 100 / 7.1, kmPerLiter: 7.1 },
  suzuki_2018: { litersPer100km: 100 / 7.1, kmPerLiter: 7.1 },
  default: { litersPer100km: 100 / 7.1, kmPerLiter: 7.1 },
};
