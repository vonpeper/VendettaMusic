// src/lib/viaticos/viaticosConfig.ts

/**
 * Default viáticos configuration.
 * This file provides fallback values for rates, city zones, and fuel pricing.
 * In the future these could be persisted to a DB or external config.
 */
export const defaultViaticosConfig = {
  // Vehicle key used for default calculations (must match a key in VEHICLE_PROFILES)
  vehicleKey: "escape_2014",
  // Origin address for calculations – can be overridden via env var DEFAULT_ORIGIN_ADDRESS
  originAddress: process.env.DEFAULT_ORIGIN_ADDRESS ?? "Metepec, Estado de México, México",
  // Base fuel price per litre in MXN (environment variable overrides)
  fuelPrice: parseFloat(process.env.FUEL_PRICE_MXN ?? "24"),
  // Fuel tax percentage applied to fuel cost (e.g., 16% VAT)
  fuelTaxPercentage: parseFloat(process.env.FUEL_TAX_PERCENTAGE ?? "16"),
  // Rates for city zones (in MXN per km)
  zona2Rate: 3,
  zona3Rate: 6,
  // Lists of cities per zone – can be extended later
  zona2Cities: ["Acatlán", "Nezahualcóyotl", "Ecatepec", "Tláhuac"],
  zona3Cities: ["Chalco", "Ixtapaluca", "Huixquilucan", "Tultitlán"],
};
