// src/lib/viaticos/googleMaps.ts
import { VEHICLE_PROFILES } from "@/lib/vehicles";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

// Environment variables are read dynamically to allow tests to set them post-import
const getApiKey = () => process.env.GOOGLE_MAPS_API_KEY;
const getDefaultOrigin = () => process.env.DEFAULT_ORIGIN_ADDRESS || "Metepec, Estado de México, México";
const getFuelPrice = () => Number(process.env.FUEL_PRICE_MXN ?? "25"); // MXN per litre

/**
 * Resultado del cálculo de viáticos.
 */
interface ViaticosResult {
  distanceKm: number;
  durationSec: number;
  tollCost: number; // MXN, 0 si no hay peaje
  viaticosAmount: number; // MXN, redondeado
}

/** In‑memory cache for viáticos calculations (TTL: 5 minutes). */
const VIATICOS_CACHE_TTL = 5 * 60 * 1000;
const viaticosCache = new Map<string, { result: ViaticosResult; timestamp: number }>();

export function clearViaticosCache() {
  viaticosCache.clear();
}

export async function calculateViaticos(
  destination: string,
  vehicleKey: string
): Promise<ViaticosResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("⚠️ GOOGLE_MAPS_API_KEY no está definida en .env");
  }

  const cacheKey = `${destination}|${vehicleKey}`;
  const cached = viaticosCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < VIATICOS_CACHE_TTL) {
    console.log("⚡️ Viáticos cache hit for", cacheKey);
    return cached.result;
  }

  const profile = VEHICLE_PROFILES[vehicleKey];
  if (!profile) {
    throw new Error(`🔧 Vehículo desconocido: ${vehicleKey}`);
  }

  const defaultOrigin = getDefaultOrigin();

  // 1️⃣ Distance Matrix
  const dmUrl = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  dmUrl.searchParams.set("origins", defaultOrigin);
  dmUrl.searchParams.set("destinations", destination);
  dmUrl.searchParams.set("mode", "driving");
  dmUrl.searchParams.set("units", "metric");
  dmUrl.searchParams.set("key", apiKey);

  const dmResp = await fetch(dmUrl.toString());
  const dmData = (await dmResp.json()) as any;
  if (dmData.status !== "OK") {
    throw new Error(`❌ Distance Matrix error: ${dmData.status}`);
  }
  const element = dmData.rows[0].elements[0];
  if (element.status !== "OK") {
    throw new Error(`❌ Ruta no encontrada: ${element.status}`);
  }
  const distanceKm = element.distance.value / 1000;
  const durationSec = element.duration.value;

  // 2️⃣ Directions (peaje real)
  const dirUrl = new URL("https://maps.googleapis.com/maps/api/directions/json");
  dirUrl.searchParams.set("origin", defaultOrigin);
  dirUrl.searchParams.set("destination", destination);
  dirUrl.searchParams.set("mode", "driving");
  dirUrl.searchParams.set("key", apiKey);

  const dirResp = await fetch(dirUrl.toString());
  const dirData = (await dirResp.json()) as any;
  if (dirData.status !== "OK") {
    throw new Error(`❌ Directions error: ${dirData.status}`);
  }
  const fareObj = dirData.routes?.[0]?.fare;
  const tollCost = fareObj?.value ?? 0;

  // 3️⃣ Cálculo combustible
  const litersNeeded = (distanceKm * profile.litersPer100km) / 100;
  const fuelCost = litersNeeded * getFuelPrice();

  // 4️⃣ Viáticos total
  const viaticosAmount = Math.round(fuelCost + tollCost);

  const result: ViaticosResult = {
    distanceKm,
    durationSec,
    tollCost,
    viaticosAmount,
  };

  viaticosCache.set(cacheKey, { result, timestamp: Date.now() });
  return result;
}
