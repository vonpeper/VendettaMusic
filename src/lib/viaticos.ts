/**
 * Lógica de viáticos de Vendetta
 * Zona local: Toluca y municipios del Valle de Toluca
 * Fuera de zona: se cobran viáticos por distancia estimada
 */

// ZONA 1: Ciudades y colonias dentro de la zona sin viáticos (Valle de Toluca)
const ZONA_LOCAL = [
  "toluca", "toluca de lerdo", "metepec", "zinacantepec", "zinaca", "ocoyoacac", "san mateo atenco", "lerma",
  "santiago tianguistenco", "tianguistenco", "capulhuac", "xonacatlan",
  "almoloya de juarez", "temoaya", "otzolotepec", "mexicaltzingo", "calimaya",
  "tenango del valle", "san antonio la isla", "rayon", "chapultepec",
  "almoloya del rio", "santa cruz atizapan", "texcalyacac", "joquicingo"
]

// ZONA 2: Media Distancia
const ZONA_2 = [
  "valle de bravo", "avandaro", "malinalco", "ixtapan de la sal", "tonatico",
  "ciudad de mexico", "cdmx", "df", "distrito federal", "naucalpan", "tlalnepantla", 
  "huixquilucan", "interlomas", "santa fe", "cuajimalpa", "alvaro obregon", "coyoacan", "tlalpan",
  "tepotzotlan", "atizapan", "izcalli"
]

// ZONA 3: Larga Distancia (Por Estado/Ciudad)
const ZONA_3 = [
  "cuernavaca", "tepoztlan", "jiutepec", "morelos", // Morelos
  "queretaro", "san juan del rio", "juriquilla",    // Querétaro
  "puebla", "cholula", "atlixco",                   // Puebla
  "pachuca", "hidalgo",                             // Hidalgo
  "tlaxcala"
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

export interface ViaticosConfig {
  zona2Rate?: number
  zona3Rate?: number
}

export function calcularViatcos(city: string, state?: string, config?: ViaticosConfig): ViaticosResult {
  const normCity = normalize(city)
  const normState = state ? normalize(state) : ""

  const isLocal = ZONA_LOCAL.some(z => normalize(z) === normCity)
  if (isLocal) {
    return {
      isOutsideZone: false,
      amount: 0,
      label: "Zona 1 (Local - Sin viáticos)",
      description: "El evento se encuentra dentro de la zona de cobertura base (Toluca/Metepec)."
    }
  }

  const isZona2 = ZONA_2.some(z => normalize(z) === normCity || (normState && normalize(z) === normState))
  if (isZona2) {
    return {
      isOutsideZone: true,
      amount: config?.zona2Rate || 1500,
      label: "Zona 2 (Media Distancia)",
      description: "Aplica tarifa de viáticos para CDMX, Valle de Bravo, Ixtapan, etc."
    }
  }

  const isZona3 = ZONA_3.some(z => normalize(z) === normCity || (normState && normalize(z) === normState))
  if (isZona3) {
    return {
      isOutsideZone: true,
      amount: config?.zona3Rate || 3000,
      label: "Zona 3 (Larga Distancia)",
      description: "Aplica tarifa foránea para Estados colindantes (Querétaro, Puebla, Morelos, etc)."
    }
  }

  // Zona 4: Resto del país o desconocido
  return {
    isOutsideZone: true,
    amount: 0, // No se cobra automáticamente
    label: "Zona 4 (Cotización Manual)",
    description: "Destino foráneo. Un asesor calculará la logística exacta en la llamada."
  }
}
