// src/lib/viaticos/googleMaps.ts
import { VEHICLE_PROFILES } from "@/lib/vehicles";
import { config as dotenvConfig } from "dotenv";
import { db } from "@/lib/db";

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
  let apiKey = "";
  let viaticosLocalRadius = 50.0;
  try {
    const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } });
    apiKey = config?.googleMapsApiKey || "";
    if (config && config.viaticosLocalRadius !== null && config.viaticosLocalRadius !== undefined) {
      viaticosLocalRadius = config.viaticosLocalRadius;
    }
  } catch (dbErr) {
    console.warn("⚠️ Error al leer configuraciones de la base de datos:", dbErr);
  }

  if (!apiKey) {
    apiKey = getApiKey() || "";
  }

  if (!apiKey) {
    throw new Error("⚠️ GOOGLE_MAPS_API_KEY no está definida en la base de datos ni en .env");
  }

  const cacheKey = `${destination}|${vehicleKey}`;
  const cached = viaticosCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < VIATICOS_CACHE_TTL) {
    console.log("⚡️ Viáticos cache hit for", cacheKey);
    return cached.result;
  }

  const defaultOrigin = getDefaultOrigin();
  let distanceKm = 0;
  let durationSec = 0;
  let tollCostSingle = 0;
  let usedRoutesApi = false;

  // 1️⃣ Intentar usar Google Maps Routes API (v2) para calcular peajes reales en México
  try {
    const routesUrl = "https://routes.googleapis.com/directions/v2:computeRoutes";
    const routesResp = await fetch(routesUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.travelAdvisory.tollInfo"
      },
      body: JSON.stringify({
        origin: { address: defaultOrigin },
        destination: { address: destination },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        extraComputations: ["TOLLS"]
      })
    });

    const routesData = (await routesResp.json()) as any;
    if (routesResp.ok && !routesData.error && routesData.routes?.[0]) {
      const route = routesData.routes[0];
      distanceKm = route.distanceMeters / 1000;
      durationSec = parseInt(route.duration?.replace("s", "") || "0");
      const tollPriceObj = route.travelAdvisory?.tollInfo?.estimatedPrice?.[0];
      tollCostSingle = tollPriceObj ? Number(tollPriceObj.units || "0") : 0;
      usedRoutesApi = true;
      console.log(`🛣️ Routes API v2 success. Distancia: ${distanceKm}km, Peaje un trayecto: ${tollCostSingle} MXN`);
    } else {
      console.warn("⚠️ Routes API v2 failed or returned empty, trying fallback Distance Matrix:", routesData.error || "No route found");
    }
  } catch (routesErr) {
    console.warn("⚠️ Routes API v2 query failed, fallback to classical Distance Matrix:", routesErr);
  }

  // 2️⃣ Fallback a Distance Matrix API clásica si Routes API v2 no funcionó
  if (!usedRoutesApi) {
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
    distanceKm = element.distance.value / 1000;
    durationSec = element.duration.value;
  }

  // 3️⃣ Cálculo de combustible (viaje redondo ida y vuelta, para ambas camionetas)
  // Rendimiento de la flota: Escape 2014 (10L/100km) + Suzuki 2018 (8L/100km) = 18L/100km
  const litersPer100kmCombined = 18; 
  const distanceKmRedondo = distanceKm * 2;
  const litersNeeded = (distanceKmRedondo * litersPer100kmCombined) / 100;
  const fuelCostTotal = litersNeeded * getFuelPrice();

  // 4️⃣ Cálculo de casetas (redondo ida y vuelta, para ambas camionetas)
  let tollCostTotal = tollCostSingle * 2 * 2; // 2 trayectos * 2 vehículos

  // Viáticos totales sumados
  let viaticosAmount = Math.round(fuelCostTotal + tollCostTotal);

  // Regla de radio de cobertura local gratuito
  if (distanceKm <= viaticosLocalRadius) {
    console.log(`📍 Distancia (${distanceKm.toFixed(1)} km) es menor o igual al radio de cobertura local gratuito (${viaticosLocalRadius} km). Viáticos asignados a 0.`);
    tollCostTotal = 0;
    viaticosAmount = 0;
  }

  const result: ViaticosResult = {
    distanceKm,
    durationSec,
    tollCost: tollCostTotal,
    viaticosAmount,
  };

  viaticosCache.set(cacheKey, { result, timestamp: Date.now() });
  return result;
}
