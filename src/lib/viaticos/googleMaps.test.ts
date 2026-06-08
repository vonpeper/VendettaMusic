// src/lib/viaticos/googleMaps.test.ts
import assert from "assert";
import { calculateViaticos, clearViaticosCache } from "./googleMaps";

// Set environment variables for testing
process.env.GOOGLE_MAPS_API_KEY = "mock_api_key_test_12345";
process.env.DEFAULT_ORIGIN_ADDRESS = "Metepec, Estado de México, México";
process.env.FUEL_PRICE_MXN = "24";

// Mock global fetch to return distance matrix and directions data
const originalFetch = global.fetch;

async function runTests() {
  console.log("🧪 Running googleMaps viaticos tests...");

  // Mock distance matrix, directions, and routes API responses
  (global as any).fetch = async (url: string, options?: any) => {
    if (url.includes("computeRoutes")) {
      return {
        ok: true,
        json: async () => ({
          routes: [
            {
              distanceMeters: 65000, // 65 km
              duration: "3600s",
              travelAdvisory: {
                tollInfo: {
                  estimatedPrice: [
                    {
                      currencyCode: "MXN",
                      units: "120", // 120 MXN toll cost single way
                    },
                  ],
                },
              },
            },
          ],
        }),
      } as any;
    } else if (url.includes("distancematrix")) {
      return {
        ok: true,
        json: async () => ({
          status: "OK",
          rows: [
            {
              elements: [
                {
                  status: "OK",
                  distance: { value: 65000 },
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
    // Test 1: Calculate viaticos for a mock destination.
    // Fuel: (65 km * 2 [round trip] * 18 L/100km [both vehicles]) / 100 * 24 MXN/Liter = 561.6 MXN
    // Tolls: 120 MXN * 2 [round trip] * 2 [both vehicles] = 480 MXN
    // Total viaticos: 561.6 fuel + 480 tolls = 1041.6 => 1042 MXN (rounded)
    const result = await calculateViaticos("CDMX", "escape_2014");
    console.log("📍 Test 1 - CDMX Result:", result);
    assert.strictEqual(result.distanceKm, 65);
    assert.strictEqual(result.durationSec, 3600);
    assert.strictEqual(result.tollCost, 480);
    assert.strictEqual(result.viaticosAmount, 1042);
    console.log("✅ Test 1 Passed!");

    // Test 2: Cache check (should return immediately)
    const start = Date.now();
    const result2 = await calculateViaticos("CDMX", "escape_2014");
    const duration = Date.now() - start;
    assert.deepStrictEqual(result2, result);
    assert.ok(duration < 50, `Cache hit should be fast, took ${duration}ms`);
    console.log("✅ Test 2 (Cache Hit) Passed!");

    // Test 3: Cache clearing
    clearViaticosCache();
    const result3 = await calculateViaticos("CDMX", "escape_2014");
    assert.deepStrictEqual(result3, result);
    console.log("✅ Test 3 (Cache Clear) Passed!");

    console.log("🎉 All tests in googleMaps.test.ts PASSED successfully!");
  } catch (err) {
    console.error("❌ Test failed:", err);
    process.exit(1);
  } finally {
    global.fetch = originalFetch;
  }
}

// Run the tests directly if executed via ts-node
if (require.main === module) {
  runTests();
}
