// src/lib/viaticos/googleMaps.test.ts
import assert from "assert";
import { calculateViaticos, clearViaticosCache } from "./googleMaps";
import { db } from "../db";

// Set environment variables for testing
process.env.GOOGLE_MAPS_API_KEY = "mock_api_key_test_12345";
process.env.DEFAULT_ORIGIN_ADDRESS = "Metepec, Estado de México, México";
process.env.FUEL_PRICE_MXN = "24";

// Mutable configuration mock to change config in different test cases
const mockConfig = {
  googleMapsApiKey: "mock_api_key_test_12345",
  viaticosLocalRadius: 50.0,
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
    // Fuel: (65 km * 2 * 18) / 100 * 24 = 561.6 MXN
    // Tolls: 120 * 2 * 2 = 480 MXN
    // Expected total: 1042 MXN (rounded)
    console.log("👉 Test 1: CDMX (65 km > 50 km local radius)");
    mockConfig.viaticosLocalRadius = 50.0;
    const resultCDMX = await calculateViaticos("CDMX", "escape_2014");
    console.log("📍 Result:", resultCDMX);
    assert.strictEqual(resultCDMX.distanceKm, 65);
    assert.strictEqual(resultCDMX.tollCost, 480);
    assert.strictEqual(resultCDMX.viaticosAmount, 1042);
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
    // Fuel: (53 km * 2 * 18) / 100 * 24 = 457.92 MXN
    // Tolls: 80 * 2 * 2 = 320 MXN
    // Expected total: 778 MXN (rounded)
    console.log("👉 Test 4: Magdalena Contreras (53 km > 50 km local radius)");
    clearViaticosCache();
    const resultMagdalena = await calculateViaticos("Magdalena Contreras", "escape_2014");
    console.log("📍 Result:", resultMagdalena);
    assert.strictEqual(resultMagdalena.distanceKm, 53);
    assert.strictEqual(resultMagdalena.tollCost, 320);
    assert.strictEqual(resultMagdalena.viaticosAmount, 778);
    console.log("✅ Test 4 Passed!");

    // Test 5: Toluca with a smaller custom radius (15 km > 10 km local radius)
    // Fuel: (15 km * 2 * 18) / 100 * 24 = 129.6 MXN
    // Tolls: 0 MXN
    // Expected total: 130 MXN (rounded)
    console.log("👉 Test 5: Toluca with custom radius of 10 km");
    mockConfig.viaticosLocalRadius = 10.0;
    clearViaticosCache();
    const resultTolucaCustom = await calculateViaticos("Toluca Centro", "escape_2014");
    console.log("📍 Result:", resultTolucaCustom);
    assert.strictEqual(resultTolucaCustom.distanceKm, 15);
    assert.strictEqual(resultTolucaCustom.tollCost, 0);
    assert.strictEqual(resultTolucaCustom.viaticosAmount, 130);
    console.log("✅ Test 5 Passed!");

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
