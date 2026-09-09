/**
 * Redondea viáticos hacia arriba en bloques de $100 MXN.
 * Función pura compartida de forma segura entre cliente y servidor.
 */
export function roundTo100(amount: number): number {
  if (!amount || amount <= 0) return 0;
  return Math.ceil(amount / 100) * 100;
}

export const roundTo500 = roundTo100;

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
  zona2Rate?: number | null
  zona3Rate?: number | null
  zona2Cities?: string | null
  zona3Cities?: string | null
}

export function isLocalCity(city: string, state?: string): boolean {
  if (!city) return false
  const normCity = normalize(city)
  const normState = state ? normalize(state) : ""
  const isStateOk = !normState || normState.includes("mexico") || normState.includes("edomex")
  if (!isStateOk) return false
  return ZONA_LOCAL.some(z => {
    const normZ = normalize(z)
    return normCity === normZ || normCity.includes(normZ)
  })
}

export function calcularViatcos(city: string, state?: string, config?: ViaticosConfig): ViaticosResult {
  const normCity = normalize(city)
  const normState = state ? normalize(state) : ""

  const isLocal = isLocalCity(city, state)
  if (isLocal) {
    return {
      isOutsideZone: false,
      amount: 0,
      label: "Zona 1 (Local - Sin viáticos)",
      description: "El evento se encuentra dentro de la zona de cobertura base (Toluca/Metepec)."
    }
  }

  // Parse dynamic zones if configured in DB, with clean normalized entries
  const activeZona2 = config?.zona2Cities && config.zona2Cities.trim() !== "" && config.zona2Cities !== "[]"
    ? config.zona2Cities.split(",").map(c => c.trim()).filter(Boolean)
    : ZONA_2;

  const activeZona3 = config?.zona3Cities && config.zona3Cities.trim() !== "" && config.zona3Cities !== "[]"
    ? config.zona3Cities.split(",").map(c => c.trim()).filter(Boolean)
    : ZONA_3;

  const isZona2 = activeZona2.some(z => normalize(z) === normCity || (normState && normalize(z) === normState))
  if (isZona2) {
    return {
      isOutsideZone: true,
      amount: roundTo100(config?.zona2Rate || 1500),
      label: "Zona 2 (Media Distancia)",
      description: "Aplica tarifa de viáticos para CDMX, Valle de Bravo, Ixtapan, etc."
    }
  }

  const isZona3 = activeZona3.some(z => normalize(z) === normCity || (normState && normalize(z) === normState))
  if (isZona3) {
    return {
      isOutsideZone: true,
      amount: roundTo100(config?.zona3Rate || 3500),
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
