// src/app/api/viaticos/route.ts

import { NextResponse } from "next/server";
import { calculateViaticos } from "@/lib/viaticos/googleMaps";
import { calcularViatcos } from "@/lib/viaticos";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get("destination");
  const vehicle = searchParams.get("vehicle") || "escape_2014";

  if (!destination) {
    return NextResponse.json({ error: "Falta el parámetro destination" }, { status: 400 });
  }

  try {
    const result = await calculateViaticos(destination, vehicle);
    return NextResponse.json({
      viaticosAmount: result.viaticosAmount,
      tollCost: result.tollCost,
      fuelCost: result.fuelCost,
      distanceKm: result.distanceKm,
      durationSec: result.durationSec,
      requiresManualQuote: result.requiresManualQuote
    });
  } catch (err) {
    console.warn("⚠️ Google Maps API calculation failed or not configured, falling back to static tabulator:", err);
    try {
      let parsedCity = "";
      let parsedState = "";
      if (destination.includes(",")) {
        const parts = destination.split(",");
        parsedCity = parts[0].trim();
        parsedState = parts[1]?.trim() || "";
      } else {
        parsedCity = destination.trim();
      }

      const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } });
      const fallback = calcularViatcos(parsedCity, parsedState, config || undefined);

      const isManual = parsedCity.toLowerCase().includes("otro") || 
                        parsedCity.toLowerCase().includes("manual") || 
                        (fallback.amount === 0 && fallback.isOutsideZone);

      return NextResponse.json({
        viaticosAmount: fallback.amount,
        tollCost: 0,
        fuelCost: 0,
        distanceKm: 0,
        durationSec: 0,
        isFallback: true,
        label: fallback.label,
        description: fallback.description,
        requiresManualQuote: isManual
      });
    } catch (fallbackErr) {
      console.error("❌ Fallback calculation failed:", fallbackErr);
      return NextResponse.json({ error: "Error interno al calcular viáticos" }, { status: 500 });
    }
  }
}
