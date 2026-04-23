/**
 * Lógica de viáticos de Vendetta
 * Zona local: Toluca y municipios del Valle de Toluca
 * Fuera de zona: se cobran viáticos por distancia estimada
 */

// Ciudades y colonias dentro de la zona sin viáticos
const ZONA_LOCAL = [
  "toluca", "metepec", "zinacantepec", "ocoyoacac", "san mateo atenco", "lerma",
  "santiago tianguistenco", "tianguistenco", "capulhuac", "xonacatlan",
  "almoloya de juarez", "temoaya", "otzolotepec", "mexicaltzingo", "calimaya",
  "tenango del valle", "san antonio la isla", "rayon", "chapultepec",
  "almoloya del rio", "santa cruz atizapan", "texcalyacac", "joquicingo"
]

export interface ViaticosResult {
  isOutsideZone: boolean
  amount: number
  label: string
  description: string
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

export function calcularViatcos(city: string, state?: string): ViaticosResult {
  // Deshabilitado temporalmente a petición del usuario.
  // Siempre devuelve 0 como si estuviera en la zona local.
  return {
    isOutsideZone: false,
    amount: 0,
    label:  "Zona Local (Sin viáticos)",
    description: "Ubicación en radio de cobertura (calculador deshabilitado temporalmente)."
  }
}
