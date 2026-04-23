#!/usr/bin/env npx tsx
/**
 * Script de importación de Excel → BandEvent (Prisma)
 * 
 * Uso:
 *   cp tu-archivo.xlsx data/eventualidades.xlsx
 *   npx tsx scripts/import-excel.ts
 * 
 * El script detecta bloques de mes (ENERO, FEBRERO...) y asigna
 * el mes correcto a cada fila. Ignora totales y filas vacías.
 */

import * as XLSX from "xlsx"
import * as fs from "fs"
import * as path from "path"
import { createClient } from "@libsql/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"

// ---- Setup DB — apunta al mismo archivo que usa el proyecto ----
const adapter = new PrismaLibSql({ url: "file:./dev.db" })
const db = new PrismaClient({ adapter } as any)

// ---- Constantes ----
const EXCEL_PATH = path.join(process.cwd(), "data", "eventualidades.xlsx")

const MONTH_NAMES: Record<string, string> = {
  ENERO:"Enero", FEBRERO:"Febrero", MARZO:"Marzo", ABRIL:"Abril",
  MAYO:"Mayo", JUNIO:"Junio", JULIO:"Julio", AGOSTO:"Agosto",
  SEPTIEMBRE:"Septiembre", OCTUBRE:"Octubre", NOVIEMBRE:"Noviembre", DICIEMBRE:"Diciembre"
}

const MONTHS_MAP: Record<string, number> = {
  Enero:0,Febrero:1,Marzo:2,Abril:3,Mayo:4,Junio:5,
  Julio:6,Agosto:7,Septiembre:8,Octubre:9,Noviembre:10,Diciembre:11
}

const RowSchema = z.object({
  fecha:    z.union([z.string(), z.number()]),
  cliente:  z.string().min(1),
  ingreso:  z.coerce.number().default(0),
  iva:      z.coerce.number().default(0),
  total:    z.coerce.number().default(0),
})

// ---- Helpers ----
function isMonthHeader(row: any[]): string | null {
  // El mes ocupa col[0] y el resto son null o "Fecha","CLIENTE" encabezados
  const first = row[0]
  if (typeof first !== "string") return null
  const clean = first.trim().toUpperCase()
  return MONTH_NAMES[clean] ?? null
}

function isHeaderRow(row: any[]): boolean {
  const strs = row.map(c => String(c || "").toLowerCase())
  return strs.some(s => s === "fecha" || s === "cliente" || s === "ingreso")
}

function isTotalRow2(row: any[]): boolean {
  // La fila de total tiene "total mes" en col[6] o texto "total" en cualquier col
  const strs = row.map(c => String(c || "").toLowerCase())
  return strs.some(s => s.includes("total") || s.includes("subtotal"))
}

function parseExcelDate(serial: any, year: number, monthName: string): Date | null {
  // Número serial Excel
  if (typeof serial === "number" && serial > 40000) {
    const d = XLSX.SSF.parse_date_code(serial)
    return new Date(d.y, d.m - 1, d.d)
  }
  // String con día solo "15" o "15/01"
  if (typeof serial === "string") {
    const clean = serial.trim()
    const parts = clean.split(/[\/\-\.]/)
    if (parts.length === 1 && !isNaN(parseInt(parts[0]))) {
      const m = MONTHS_MAP[monthName]
      return new Date(year, m ?? 0, parseInt(parts[0]))
    }
    if (parts.length >= 2) {
      const day = parseInt(parts[0])
      const mon = parseInt(parts[1]) - 1
      const yr  = parts[2] ? parseInt(parts[2]) : year
      return new Date(yr, mon, day)
    }
  }
  return null
}

// ---- Main ----
async function main() {
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`\n❌ Archivo no encontrado: ${EXCEL_PATH}`)
    console.error("   Copia tu Excel a: data/eventualidades.xlsx\n")
    process.exit(1)
  }

  console.log("📂 Leyendo Excel:", EXCEL_PATH)
  const wb = XLSX.readFile(EXCEL_PATH)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  // Estructura: col[0]=Bloque mes, col[1]=Fecha, col[2]=Cliente, col[3]=Ingreso, col[4]=IVA, col[5]=Total
  const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })

  let currentMonth = "Enero"
  let currentYear  = new Date().getFullYear()
  let imported = 0
  let skipped  = 0

  for (const row of raw) {

    // Fila completamente vacía
    if (!row || row.every(c => c === null || c === "")) {
      skipped++
      continue
    }

    // Detectar encabezado de mes (col[0] = "ENERO", "FEBRERO"...)
    const monthMatch = isMonthHeader(row)
    if (monthMatch) {
      currentMonth = monthMatch
      console.log(`\n📅 Mes: ${currentMonth}`)
      continue
    }

    // Ignorar fila de encabezados de columna
    if (isHeaderRow(row)) {
      skipped++
      continue
    }

    // Ignorar fila de totales
    if (isTotalRow2(row)) {
      console.log("   ⏭  Total ignorado:", row.filter(Boolean).join(" | "))
      skipped++
      continue
    }

    // Extraer datos — col[1]=fecha, col[2]=cliente, col[3]=ingreso, col[4]=iva, col[5]=total
    const rawFecha   = row[1]
    const rawCliente = row[2]
    const rawIngreso = row[3]
    const rawIva     = row[4]
    const rawTotal   = row[5]

    // Validar cliente
    if (!rawCliente || String(rawCliente).trim() === "") {
      skipped++
      continue
    }
    const clientStr = String(rawCliente).trim()

    // Parsear números
    const ingreso = typeof rawIngreso === "number" ? rawIngreso : parseFloat(String(rawIngreso || "0").replace(/[$,\s]/g, "")) || 0
    const iva     = typeof rawIva     === "number" ? rawIva     : parseFloat(String(rawIva     || "0").replace(/[$,\s]/g, "")) || 0
    let   total   = typeof rawTotal   === "number" ? rawTotal   : parseFloat(String(rawTotal   || "0").replace(/[$,\s]/g, "")) || 0
    if (total === 0) total = ingreso + iva

    // Parsear fecha
    const fecha = parseExcelDate(rawFecha, currentYear, currentMonth)
    if (!fecha) {
      console.warn(`   ⚠️  Fecha no parseable para "${clientStr}": ${rawFecha}`)
      // Usar día 1 del mes como fallback
      const m = MONTHS_MAP[currentMonth]
      const fallback = new Date(currentYear, m ?? 0, 1)
      try {
        await db.bandEvent.create({
          data: {
            eventDate:   fallback,
            eventMonth:  currentMonth,
            eventYear:   currentYear,
            clientName:  clientStr,
            baseIncome:  ingreso,
            ivaAmount:   iva,
            totalIncome: total,
            status:      "completado",
            eventType:   "show",
            source:      "excel_import",
          }
        })
        console.log(`   ✅ (fecha aprox.) ${fallback.toLocaleDateString("es-MX")} | ${clientStr} | $${total.toLocaleString("es-MX")}`)
        imported++
      } catch (err) {
        console.error(`   ❌ Error:`, err)
        skipped++
      }
      continue
    }

    try {
      await db.bandEvent.create({
        data: {
          eventDate:   fecha,
          eventMonth:  currentMonth,
          eventYear:   fecha.getFullYear(),
          clientName:  clientStr,
          baseIncome:  ingreso,
          ivaAmount:   iva,
          totalIncome: total,
          status:      "completado",
          eventType:   "show",
          source:      "excel_import",
        }
      })
      console.log(`   ✅ ${fecha.toLocaleDateString("es-MX")} | ${clientStr} | $${total.toLocaleString("es-MX")}`)
      imported++
    } catch (err) {
      console.error(`   ❌ Error importando "${clientStr}":`, err)
      skipped++
    }
  }

  console.log(`\n🎉 Importación completa: ${imported} eventos importados, ${skipped} filas ignoradas.\n`)
  await db.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
