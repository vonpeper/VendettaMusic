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

  // Mock distance matrix and directions responses
  (global as any).fetch = async (url: string) => {
    if (url.includes("distancematrix")) {
      return {
        ok: true,
        json: async () => ({
          status: "OK",
          rows: [
            {
              elements: [
                {
                  status: "OK",
                  distance: { value: 65000 }, // 65 km
                  duration: { value: 3600 },  // 1 hour
                },
              ],
            },
          ],
        }),
      } as any;
    } else if (url.includes("directions")) {
      return {
        ok: true,
        json: async () => ({
          status: "OK",
          routes: [
            {
              fare: { value: 120 }, // 120 MXN toll cost
            },
          ],
        }),
      } as any;
    }
    return { ok: false } as any;
  };

  try {
    // Test 1: Calculate viaticos for a mock destination with Escape 2014 (10L/100km)
    // 65 km * 10L/100km = 6.5 Liters
    // 6.5 Liters * 24 MXN/Liter = 156 MXN fuel
    // 156 MXN fuel + 120 MXN tolls = 276 MXN total
    const result = await calculateViaticos("CDMX", "escape_2014");
    console.log("📍 Test 1 - CDMX (Escape 2014) Result:", result);
    assert.strictEqual(result.distanceKm, 65);
    assert.strictEqual(result.durationSec, 3600);
    assert.strictEqual(result.tollCost, 120);
    assert.strictEqual(result.viaticosAmount, 276);
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
    // (mock fetch should be called again, which it will be, same result)
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
