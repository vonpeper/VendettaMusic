// src/lib/viaticos/googleMaps.test.ts
import assert from "assert";
import { calculateViaticos, clearViaticosCache } from "./googleMaps";
import { db } from "../db";

// Set environment variables for testing
process.env.GOOGLE_MAPS_API_KEY = "mock_api_key_test_12345";
process.env.DEFAULT_ORIGIN_ADDRESS = "Metepec, Estado de México, México";
process.env.FUEL_PRICE_MXN = "24";

// Mutable configuration mock to change config in different test cases
const mockConfig: {
  googleMapsApiKey: string;
  viaticosLocalRadius: number;
  viaticosVehicleCount?: number;
} = {
  googleMapsApiKey: "mock_api_key_test_12345",
  viaticosLocalRadius: 50.0,
  viaticosVehicleCount: 2,
};

// Mock global Prisma client queries
db.globalConfig.findUnique = (async () => {
  return mockConfig as any;
}) as any;

// Mock global fetch to return distance matrix and directions data dynamically
const originalFetch = global.fetch;

async function runTests() {
  console.log("🧪 Running googleMaps viaticos tests...");

  // Mock distance matrix, directions, and routes API responses dynamically based on destination
  (global as any).fetch = async (url: string, options?: any) => {
    let destination = "CDMX";
    
    // Attempt to extract destination from fetch parameters
    if (url.includes("computeRoutes") && options?.body) {
      try {
        const body = JSON.parse(options.body);
        destination = body.destination?.address || "CDMX";
      } catch (e) {}
    } else if (url.includes("distancematrix")) {
      const urlObj = new URL(url);
      destination = urlObj.searchParams.get("destinations") || "CDMX";
    }

    if (url.includes("computeRoutes")) {
      let distanceMeters = 65000; // Default CDMX
      let tollUnits = "120";

      if (destination.includes("Toluca")) {
        distanceMeters = 15000;
        tollUnits = "0";
      } else if (destination.includes("Magdalena")) {
        distanceMeters = 53000;
        tollUnits = "80";
      }

      return {
        ok: true,
        json: async () => ({
          routes: [
            {
              distanceMeters,
              duration: "3600s",
              travelAdvisory: {
                tollInfo: {
                  estimatedPrice: [
                    {
                      currencyCode: "MXN",
                      units: tollUnits,
                    },
                  ],
                },
              },
            },
          ],
        }),
      } as any;
    } else if (url.includes("distancematrix")) {
      let distanceValue = 65000; // Default CDMX

      if (destination.includes("Toluca")) {
        distanceValue = 15000;
      } else if (destination.includes("Magdalena")) {
        distanceValue = 53000;
      }

      return {
        ok: true,
        json: async () => ({
          status: "OK",
          rows: [
            {
              elements: [
                {
                  status: "OK",
                  distance: { value: distanceValue },
                  duration: { value: 3600 },
                },
              ],
            },
          ],
        }),
      } as any;
    }
    return { ok: false } as any;
  };

  try {
    // Reset cache before starting
    clearViaticosCache();

    // Test 1: CDMX (65 km > 50 km local radius)
    // Fuel: (65 km * 2 * (100 / 7.1 * 2)) / 100 * 24 = 878.87 -> 879 MXN
    // Tolls: 120 * 2 * 2 = 480 MXN
    // Expected total: roundTo100(879 + 480) = 1400 MXN
    console.log("👉 Test 1: CDMX (65 km > 50 km local radius)");
    mockConfig.viaticosLocalRadius = 50.0;
    mockConfig.viaticosVehicleCount = 2;
    const resultCDMX = await calculateViaticos("CDMX", "escape_2014");
    console.log("📍 Result:", resultCDMX);
    assert.strictEqual(resultCDMX.distanceKm, 65);
    assert.strictEqual(resultCDMX.tollCost, 480);
    assert.strictEqual(resultCDMX.viaticosAmount, 1400);
    console.log("✅ Test 1 Passed!");

    // Test 2: Cache check
    console.log("👉 Test 2: Cache Hit Check");
    const start = Date.now();
    const resultCache = await calculateViaticos("CDMX", "escape_2014");
    const duration = Date.now() - start;
    assert.deepStrictEqual(resultCache, resultCDMX);
    assert.ok(duration < 50, `Cache hit should be fast, took ${duration}ms`);
    console.log("✅ Test 2 Passed!");

    // Test 3: Toluca (15 km <= 50 km local radius) -> Should return 0
    console.log("👉 Test 3: Toluca (15 km <= 50 km local radius)");
    clearViaticosCache();
    const resultToluca = await calculateViaticos("Toluca Centro", "escape_2014");
    console.log("📍 Result:", resultToluca);
    assert.strictEqual(resultToluca.distanceKm, 15);
    assert.strictEqual(resultToluca.tollCost, 0);
    assert.strictEqual(resultToluca.viaticosAmount, 0);
    console.log("✅ Test 3 Passed!");

    // Test 4: Magdalena Contreras (53 km > 50 km local radius)
    // Fuel: (53 km * 2 * (100 / 7.1 * 2)) / 100 * 24 = 716.6 -> 717 MXN
    // Tolls: 80 * 2 * 2 = 320 MXN
    // Expected total: roundTo100(717 + 320) = 1100 MXN
    console.log("👉 Test 4: Magdalena Contreras (53 km > 50 km local radius)");
    clearViaticosCache();
    const resultMagdalena = await calculateViaticos("Magdalena Contreras", "escape_2014");
    console.log("📍 Result:", resultMagdalena);
    assert.strictEqual(resultMagdalena.distanceKm, 53);
    assert.strictEqual(resultMagdalena.tollCost, 320);
    assert.strictEqual(resultMagdalena.viaticosAmount, 1100);
    console.log("✅ Test 4 Passed!");

    // Test 5: Toluca with a smaller custom radius (15 km > 10 km local radius)
    // Fuel: (15 km * 2 * (100 / 7.1 * 2)) / 100 * 24 = 202.8 -> 203 MXN
    // Tolls: 0 MXN
    // Expected total: roundTo100(203) = 300 MXN
    console.log("👉 Test 5: Toluca with custom radius of 10 km");
    mockConfig.viaticosLocalRadius = 10.0;
    clearViaticosCache();
    const resultTolucaCustom = await calculateViaticos("Toluca Centro", "escape_2014");
    console.log("📍 Result:", resultTolucaCustom);
    assert.strictEqual(resultTolucaCustom.distanceKm, 15);
    assert.strictEqual(resultTolucaCustom.tollCost, 0);
    assert.strictEqual(resultTolucaCustom.viaticosAmount, 300);
    console.log("✅ Test 5 Passed!");

    // Test 6: Destino a larga distancia (> 250 km, ej. Guerrero a 280 km)
    console.log("👉 Test 6: Guerrero (> 250 km)");
    const tempFetch = global.fetch;
    (global as any).fetch = async (url: string, options?: any) => {
      return {
        ok: true,
        json: async () => ({
          routes: [
            {
              distanceMeters: 280000,
              duration: "12000s",
              travelAdvisory: {
                tollInfo: {
                  estimatedPrice: [{ currencyCode: "MXN", units: "200" }]
                }
              }
            }
          ]
        })
      } as any;
    };
    clearViaticosCache();
    const resultGuerrero = await calculateViaticos("Buenavista de Cuéllar", "escape_2014");
    console.log("📍 Result:", resultGuerrero);
    assert.strictEqual(resultGuerrero.distanceKm, 280);
    assert.strictEqual(resultGuerrero.requiresManualQuote, true);
    console.log("✅ Test 6 Passed!");
    global.fetch = tempFetch;

    // Test 7: CDMX con 1 solo vehículo configurado
    // Fuel: (65 km * 2 * (100 / 7.1 * 1)) / 100 * 24 = 439.4 -> 439 MXN
    // Tolls: 120 * 2 * 1 = 240 MXN
    // Expected total: roundTo100(439 + 240) = 700 MXN
    console.log("👉 Test 7: CDMX con 1 solo vehículo configurado");
    mockConfig.viaticosLocalRadius = 50.0;
    (mockConfig as any).viaticosVehicleCount = 1;
    clearViaticosCache();
    // Re-mocking global fetch for 65 km
    const tempFetch2 = global.fetch;
    (global as any).fetch = async (url: string, options?: any) => {
      return {
        ok: true,
        json: async () => ({
          routes: [
            {
              distanceMeters: 65000,
              duration: "3600s",
              travelAdvisory: {
                tollInfo: {
                  estimatedPrice: [{ currencyCode: "MXN", units: "120" }]
                }
              }
            }
          ]
        })
      } as any;
    };
    const resultOneVehicle = await calculateViaticos("CDMX", "escape_2014");
    console.log("📍 Result:", resultOneVehicle);
    assert.strictEqual(resultOneVehicle.tollCost, 240);
    assert.strictEqual(resultOneVehicle.viaticosAmount, 700);
    console.log("✅ Test 7 Passed!");
    global.fetch = tempFetch2;

    // Test 8: San Mateo Xoloc / Tepotzotlán (Ruta conocida calibrada)
    // Distance: 90 km, Toll: 178 single
    // Fuel con 2 vehículos a $24/L (en mock): (90 * 2 * (100 / 7.1 * 2)) / 100 * 24 = 1216.9 -> 1217 MXN
    // Tolls con 2 vehículos: 178 * 2 * 2 = 712 MXN
    // Total unrounded: 1217 + 712 = 1929 MXN -> roundTo100 = 2000 MXN (a $24/L)
    console.log("👉 Test 8: San Mateo Xoloc / Tepotzotlán (Tabulador Calibrado)");
    mockConfig.viaticosVehicleCount = 2;
    mockConfig.viaticosLocalRadius = 25.0;
    clearViaticosCache();
    // Forzamos fetch a fallar para verificar la resolución por KnownRoute
    const tempFetch3 = global.fetch;
    (global as any).fetch = async () => ({ ok: false } as any);
    const resultXoloc = await calculateViaticos("Av. Insurgentes 68, 54602 San Mateo Xoloc, Méx.", "escape_2014");
    console.log("📍 Result San Mateo Xoloc:", resultXoloc);
    assert.strictEqual(resultXoloc.distanceKm, 90);
    assert.strictEqual(resultXoloc.tollCost, 712);
    assert.strictEqual(resultXoloc.viaticosAmount, 2000); // 2000 con mock a $24/L
    console.log("✅ Test 8 Passed!");
    global.fetch = tempFetch3;

    // Test 9: Google Maps URL con coordenadas en zona local (Hacienda La Puerta en Metepec)
    console.log("👉 Test 9: Google Maps URL con coordenadas locales (Hacienda La Puerta, Metepec)");
    mockConfig.viaticosVehicleCount = 2;
    mockConfig.viaticosLocalRadius = 25.0;
    clearViaticosCache();
    const haciendaUrl = "https://www.google.com/maps/place/Hacienda+La+Puerta/@19.3647272,-99.7056305,17z/data=!3m1!4b1!4m6!3m5!1s0x85d27773236cfcb9:0xbf85bfab71916a1!8m2!3d19.3647222!4d-99.7030556!16s%2Fg%2F11ckqzf1bv";
    const resultHacienda = await calculateViaticos(haciendaUrl, "escape_2014");
    console.log("📍 Result Hacienda La Puerta URL:", resultHacienda);
    assert.strictEqual(resultHacienda.viaticosAmount, 0);
    assert.strictEqual(resultHacienda.tollCost, 0);
    assert.strictEqual(resultHacienda.fuelCost, 0);
    assert.strictEqual(resultHacienda.requiresManualQuote, false);
    assert.ok(resultHacienda.distanceKm <= 25.0);
    console.log("✅ Test 9 Passed!");

    console.log("🎉 All tests in googleMaps.test.ts PASSED successfully!");
  } catch (err) {
    console.error("❌ Test failed:", err);
    process.exit(1);
  } finally {
    global.fetch = originalFetch;
  }
}

// Run the tests directly if executed via ts-node / tsx
if (require.main === module) {
  runTests();
}
