// src/lib/viaticos/googleMaps.ts
import { VEHICLE_PROFILES } from "@/lib/vehicles";
import { db } from "@/lib/db";
import { roundTo100, roundTo500 } from "@/lib/viaticos";

export { roundTo100, roundTo500 };

// Environment variables are read dynamically to allow tests to set them post-import
const getApiKey = () => process.env.GOOGLE_MAPS_API_KEY;
const getDefaultOrigin = () => process.env.DEFAULT_ORIGIN_ADDRESS || "Metepec, Estado de México, México";
const getFuelPrice = () => Number(process.env.FUEL_PRICE_MXN ?? "25"); // MXN per litre

/**
 * Resultado del cálculo de viáticos.
 */
export interface ViaticosResult {
  distanceKm: number;
  durationSec: number;
  tollCost: number; // MXN, 0 si no hay peaje
  fuelCost: number; // MXN, costo estimado de combustible
  viaticosAmount: number; // MXN, redondeado
  requiresManualQuote: boolean; // true si > 250km
}

/** In‑memory cache for viáticos calculations (TTL: 5 minutes). */
const VIATICOS_CACHE_TTL = 5 * 60 * 1000;
const viaticosCache = new Map<string, { result: ViaticosResult; timestamp: number }>();

export function clearViaticosCache() {
  viaticosCache.clear();
  console.log("🧹 Viáticos cache cleared successfully");
}

interface KnownRoute {
  keywords: string[];
  distanceKm: number;
  durationSec: number;
  tollCostSingle: number;
}

const KNOWN_ROUTES: KnownRoute[] = [
  // Querétaro / San Juan del Río / Juriquilla
  {
    keywords: ["queretaro", "santiago de queretaro", "juriquilla", "san juan del rio", "el marques", "corregidora"],
    distanceKm: 195,
    durationSec: 8400, // 2h 20m
    tollCostSingle: 327 // El Dorado ($105) + Atlacomulco-Palmillas ($120) + Palmillas-Qro ($102)
  },
  // CDMX / Zona Metropolitana
  {
    keywords: ["ciudad de mexico", "cdmx", "df", "distrito federal", "santa fe", "interlomas", "cuajimalpa", "alvaro obregon", "coyoacan", "tlalpan", "miguel hidalgo", "benito juarez", "naucalpan", "tlalnepantla", "atizapan", "iztapalapa", "iztacalco", "gustavo a madero", "venustiano carranza", "azcapotzalco"],
    distanceKm: 65,
    durationSec: 4200, // 1h 10m
    tollCostSingle: 120 // Caseta México-Toluca
  },
  // Valle de Bravo / Avándaro
  {
    keywords: ["valle de bravo", "avandaro", "colorines", "donato guerra"],
    distanceKm: 85,
    durationSec: 5400, // 1h 30m
    tollCostSingle: 170
  },
  // Malinalco / Tenancingo
  {
    keywords: ["malinalco", "tenancingo", "chalma"],
    distanceKm: 70,
    durationSec: 4800,
    tollCostSingle: 60
  },
  // Ixtapan de la Sal / Tonatico
  {
    keywords: ["ixtapan de la sal", "tonatico", "villa guerrero"],
    distanceKm: 75,
    durationSec: 4500,
    tollCostSingle: 115
  },
  // Morelos: Cuernavaca / Tepoztlán
  {
    keywords: ["cuernavaca", "tepoztlan", "jiutepec", "morelos", "yautepec"],
    distanceKm: 120,
    durationSec: 7200,
    tollCostSingle: 240
  },
  // Puebla / Cholula / Atlixco
  {
    keywords: ["puebla", "cholula", "atlixco", "san martin texmelucan"],
    distanceKm: 190,
    durationSec: 9000,
    tollCostSingle: 290
  },
  // Hidalgo: Pachuca / Tulancingo
  {
    keywords: ["pachuca", "hidalgo", "tulancingo", "mineral del monte"],
    distanceKm: 160,
    durationSec: 7800,
    tollCostSingle: 210
  }
];

const LOCAL_KEYWORDS = [
  "metepec", "toluca", "zinacantepec", "san mateo atenco", "lerma", 
  "ocoyoacac", "calimaya", "mexicaltzingo", "san antonio la isla", "rayon",
  "tianguistenco", "chapultepec", "almoloya de juarez", "temoaya", "otzolotepec"
];

function findKnownRoute(destination: string): KnownRoute | null {
  const norm = destination.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Si es zona local del Valle de Toluca, retornar distancia dentro del radio gratuito
  if (LOCAL_KEYWORDS.some(k => norm.includes(k))) {
    return {
      keywords: [""],
      distanceKm: 12,
      durationSec: 1200,
      tollCostSingle: 0
    };
  }

  for (const r of KNOWN_ROUTES) {
    if (r.keywords.some(k => norm.includes(k))) {
      return r;
    }
  }
  return null;
}

export async function calculateViaticos(
  destination: string,
  vehicleKey: string
): Promise<ViaticosResult> {
  let apiKey = "";
  let viaticosLocalRadius = 25.0; // Radio local sin viáticos (25 km Metepec/Toluca)
  let viaticosVehicleCount = 2;   // Flota Vendetta: 2 vehículos (equipo/staff + músicos)
  try {
    const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } });
    apiKey = config?.googleMapsApiKey || "";
    if (config && config.viaticosLocalRadius !== null && config.viaticosLocalRadius !== undefined) {
      viaticosLocalRadius = config.viaticosLocalRadius;
    }
    if (config && config.viaticosVehicleCount !== null && config.viaticosVehicleCount !== undefined) {
      viaticosVehicleCount = config.viaticosVehicleCount;
    }
  } catch (dbErr) {
    console.warn("⚠️ Error al leer configuraciones de la base de datos:", dbErr);
  }

  // 1️⃣ Consultar caché usando la clave extendida que incluye el radio y el número de vehículos configurados
  const cacheKey = `${destination}|${vehicleKey}|${viaticosLocalRadius}|${viaticosVehicleCount}`;
  const cached = viaticosCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < VIATICOS_CACHE_TTL) {
    console.log("⚡️ Viáticos cache hit for", cacheKey);
    return cached.result;
  }

  if (!apiKey) {
    apiKey = getApiKey() || "";
  }

  const defaultOrigin = getDefaultOrigin();
  let distanceKm = 0;
  let durationSec = 0;
  let tollCostSingle = 0;
  let routeResolved = false;

  // 2️⃣ Intentar usar Google Maps Routes API (v2) para calcular peajes reales en México si hay API key
  if (apiKey) {
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
        routeResolved = true;
        console.log(`🛣️ Routes API v2 éxito. Distancia: ${distanceKm}km, Peaje un trayecto: ${tollCostSingle} MXN`);
      } else {
        console.warn("⚠️ Routes API v2 falló o requiere billing, intentando fallback:", routesData.error?.message || "No route found");
      }
    } catch (routesErr) {
      console.warn("⚠️ Error en Routes API v2:", routesErr);
    }

    // 3️⃣ Fallback a Distance Matrix API clásica si Routes API v2 no funcionó
    if (!routeResolved) {
      try {
        const dmUrl = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
        dmUrl.searchParams.set("origins", defaultOrigin);
        dmUrl.searchParams.set("destinations", destination);
        dmUrl.searchParams.set("mode", "driving");
        dmUrl.searchParams.set("units", "metric");
        dmUrl.searchParams.set("key", apiKey);

        const dmResp = await fetch(dmUrl.toString());
        const dmData = (await dmResp.json()) as any;
        if (dmData.status === "OK") {
          const element = dmData.rows?.[0]?.elements?.[0];
          if (element && element.status === "OK") {
            distanceKm = element.distance.value / 1000;
            durationSec = element.duration.value;
            routeResolved = true;
          }
        }
      } catch (dmErr) {
        console.warn("⚠️ Error en Distance Matrix API:", dmErr);
      }
    }
  }

  // 4️⃣ Fallback inteligente por tabla maestra de rutas conocidas si Google Maps no resolvió
  if (!routeResolved) {
    const known = findKnownRoute(destination);
    if (known) {
      distanceKm = known.distanceKm;
      durationSec = known.durationSec;
      tollCostSingle = known.tollCostSingle;
      routeResolved = true;
      console.log(`📍 Ruta resuelta por tabulador maestro calibrado: ${destination} (${distanceKm} km, caseta: $${tollCostSingle})`);
    } else {
      // Si no es una ruta conocida ni Google Maps resolvió, estimar distancia por zona
      distanceKm = 60; // Estimación base para destinos no mapeados fuera de zona
      durationSec = 3600;
      tollCostSingle = 100;
      console.warn(`⚠️ Destino no mapeado en rutas conocidas: ${destination}. Usando estimación base.`);
    }
  }

  // 5️⃣ Cálculo de combustible (viaje redondo ida y vuelta, para N camionetas)
  // Rendimiento calibrado con consumo real (ej. Querétaro):
  // 1 tanque de $1,000 MXN (40L) para 400 km redondos = 10 L / 100km (10 km/L) a $25/L de gasolina.
  const vehicleProfile = VEHICLE_PROFILES[vehicleKey] || { litersPer100km: 10 };
  const litersPer100kmSingle = vehicleProfile.litersPer100km || 10;
  const litersPer100kmCombined = litersPer100kmSingle * viaticosVehicleCount;
  const distanceKmRedondo = distanceKm * 2;
  const litersNeeded = (distanceKmRedondo * litersPer100kmCombined) / 100;
  let fuelCostTotal = Math.round(litersNeeded * getFuelPrice());

  // 6️⃣ Cálculo de casetas (redondo ida y vuelta, para N camionetas)
  let tollCostTotal = tollCostSingle * 2 * viaticosVehicleCount;

  // Viáticos totales redondeados en bloques de $100 MXN (ej: 1467 -> 1500, 1965 -> 2000, 2007 -> 2100, 3180 -> 3200)
  let viaticosAmount = roundTo100(fuelCostTotal + tollCostTotal);

  // Regla de radio de cobertura local gratuito (ej. Toluca/Metepec <= 25km)
  if (distanceKm <= viaticosLocalRadius) {
    console.log(`📍 Distancia (${distanceKm.toFixed(1)} km) es menor o igual al radio de cobertura local gratuito (${viaticosLocalRadius} km). Viáticos asignados a 0.`);
    tollCostTotal = 0;
    fuelCostTotal = 0;
    viaticosAmount = 0;
  }

  // Regla de logística extendida (> 250km)
  const requiresManualQuote = distanceKm > 250.0;

  const result: ViaticosResult = {
    distanceKm,
    durationSec,
    tollCost: tollCostTotal,
    fuelCost: fuelCostTotal,
    viaticosAmount,
    requiresManualQuote,
  };

  viaticosCache.set(cacheKey, { result, timestamp: Date.now() });
  return result;
}
