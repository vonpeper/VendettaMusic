import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont, degrees } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import { db } from "@/lib/db"
import { FunnelData } from "@/components/funnel/FunnelWizard"
import { formatDateMX } from "@/lib/utils"

/**
 * Generador de PDF "v4": Texto Justificado, Branding Premium y Cláusula de Soundcheck.
 */

const VENDETTA_RED = rgb(0.87, 0.16, 0.17)
const SUCCESS_GREEN = rgb(0.18, 0.49, 0.20)
const BLACK_COLOR = rgb(0, 0, 0)
const GRAY_BG = rgb(0.97, 0.97, 0.97)
const WHITE_COLOR = rgb(1, 1, 1)

interface DrawContext {
  page: PDFPage
  font: PDFFont
  boldFont: PDFFont
  y: number
  margin: number
  width: number
  height: number
  doc: PDFDocument
}

function stripBase64Prefix(base64: string) {
  if (base64.startsWith("data:")) {
    const parts = base64.split(",");
    if (parts.length > 1) return parts[1];
  }
  return base64;
}

const PACKAGE_INCLUSIONS: Record<string, string[]> = {
  "61a5477c-de10-4788-a8bd-1dfa8b57d256": [
    "Sistema de audio profesional",
    "Backline de gira",
    "Iluminación básica RGB",
    "4 integrantes + Ingeniero + Staff"
  ],
  "clx-experience-id": [
    "Todo lo del paquete Essential",
    "Audio profesional (100 a 300 personas)",
    "Mejora en calidad y cobertura de sonido",
    "Monitoreo inalámbrico profesional (IEMs)"
  ],
  "4e3406f6-cb05-4cf4-805b-24b5cd9c2b62": [
    "Todo lo del paquete Experience",
    "Pantalla LED 3x2 metros",
    "Iluminación robótica avanzada",
    "Templete (Escenario)",
    "Producción completa tipo concierto"
  ],
  "bar": [
    "Sistema de audio profesional",
    "Backline completo",
    "4 integrantes + Ingenieria en audio + Staff",
    "2 turnos de 45 minutos"
  ]
}

export interface GenerateContractPdfOptions {
  includeLegal?: boolean
  clientSignature?: string
  adminSignature?: string
  signedAt?: string
  contractLegalText?: string
  contractType?: "standard" | "happening" | "custom"
  bankName?: string | null
  bankAccount?: string | null
  bankClabe?: string | null
  bankBeneficiary?: string | null
}

export async function generateContractPdf(
  data: FunnelData, 
  shortId: string, 
  options: GenerateContractPdfOptions = { includeLegal: true }
) {
  console.log(`[PDF Generator] Finalizing document. includeLegal=${!!options.includeLegal}`)
  
  // Se eliminó la obligatoriedad de contar con link de Google Maps para permitir descargar la versión de cotización o contrato sin trabas.


  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)

  let montserrat, montserratBold, logoImage
  try {
    let fontBytes: Uint8Array | ArrayBuffer | undefined;
    let boldFontBytes: Uint8Array | ArrayBuffer | undefined;
    let logoBytes: Uint8Array | ArrayBuffer | undefined;

    if (typeof window === "undefined") {
      const _fs = require("fs")
      const _path = require("path")
      const publicDir = _path.resolve(process.cwd(), "public")
      const regularPath = _path.join(publicDir, "fonts/Montserrat-Regular.ttf")
      const boldPath = _path.join(publicDir, "fonts/Montserrat-Bold.ttf")
      const logoPath = _path.join(publicDir, "logo.png")

      if (_fs.existsSync(regularPath)) fontBytes = new Uint8Array(_fs.readFileSync(regularPath))
      if (_fs.existsSync(boldPath)) boldFontBytes = new Uint8Array(_fs.readFileSync(boldPath))
      if (_fs.existsSync(logoPath)) logoBytes = new Uint8Array(_fs.readFileSync(logoPath))
      
      if (fontBytes) montserrat = await doc.embedFont(fontBytes)
      if (boldFontBytes) montserratBold = await doc.embedFont(boldFontBytes)
      if (logoBytes) logoImage = await doc.embedPng(logoBytes)
    } else {
      const [fB, bFB, lB] = await Promise.all([
        fetch("/fonts/Montserrat-Regular.ttf").then(res => res.arrayBuffer()).catch(() => null),
        fetch("/fonts/Montserrat-Bold.ttf").then(res => res.arrayBuffer()).catch(() => null),
        fetch("/logo.png").then(res => res.arrayBuffer()).catch(() => null)
      ])
      if (fB) montserrat = await doc.embedFont(fB)
      if (bFB) montserratBold = await doc.embedFont(bFB)
      if (lB) logoImage = await doc.embedPng(lB)
    }
  } catch (err) {
    console.error("Error loading high-fidelity assets for PDF:", err)
  }

  if (!montserrat) montserrat = await doc.embedFont(StandardFonts.Helvetica)
  if (!montserratBold) montserratBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const pageHeight = 841.89
  const pageWidth = 595.28
  const margin = 50
  
  let page = doc.addPage([pageWidth, pageHeight])
  const ctx: DrawContext = {
    page,
    font: montserrat,
    boldFont: montserratBold,
    y: pageHeight - margin,
    margin,
    width: pageWidth,
    height: pageHeight,
    doc
  }

  // --- NUEVO: INSERTAR PÁGINA PERSONALIZADA DESDE public/assets/quotes/[packageId].pdf ---
  if (typeof window === "undefined") {
    try {
      const _fs = require("fs")
      const _path = require("path")
      const customPdfPath = _path.join(process.cwd(), "public/assets/quotes", `${data.packageId}.pdf`)
      if (_fs.existsSync(customPdfPath)) {
        const customBytes = _fs.readFileSync(customPdfPath)
        const customDoc = await PDFDocument.load(customBytes)
        const copiedPages = await doc.copyPages(customDoc, customDoc.getPageIndices())
        // Insertamos al principio (antes de la cotización)
        for (let i = 0; i < copiedPages.length; i++) {
          doc.insertPage(i, copiedPages[i])
        }
      }
    } catch (err) {
      console.error("❌ Error al adjuntar PDF personalizado:", err)
    }
  }

  const safeValue = (val: any, fallback = "N/A") => (val && val !== "undefined" && val !== "") ? String(val) : fallback
  const MXN = (v: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v || 0)

  const isHappening = options.contractType === "happening";

  const isEarlySoundcheck = (data as any).adminNote?.toLowerCase().includes("soundcheck") || false
  const extraSoundcheck = isEarlySoundcheck ? 2000 : 0
  // fullAddress se define abajo para evitar ReferenceError en algunos entornos de ejecución
  const baseTotal = data.packagePrice + (data.viaticosAmount || 0)
  const subtotal = baseTotal + extraSoundcheck
  const ivaAmount = (isHappening || (data as any).invoice) ? Math.round(subtotal * 0.16 * 100) / 100 : ((data as any).ivaAmount || 0)
  const total = subtotal + ivaAmount

  const logoDims = logoImage ? logoImage.scale(0.16) : { width: 0, height: 0 }
  if (logoImage) {
    page.drawImage(logoImage, { x: margin, y: ctx.y - logoDims.height, width: logoDims.width, height: logoDims.height })
  }

  const readableDate = formatDateSpanish(new Date().toISOString())
  const headerInfo = [
    { text: "FOLIO: " + safeValue(shortId, "PENDIENTE"), size: 13, font: montserratBold, color: VENDETTA_RED },
    { text: `TOLUCA, MÉXICO A ${readableDate.toUpperCase()}`, size: 8, font: montserrat, color: rgb(0.3, 0.3, 0.3) }
  ]

  let textY = ctx.y - 10
  headerInfo.forEach(item => {
    page.drawText(item.text, { x: pageWidth - margin - item.font.widthOfTextAtSize(item.text, item.size), y: textY, size: item.size, font: item.font, color: item.color })
    textY -= item.size + 6
  })

  ctx.y -= Math.max(logoDims.height, 40) + 25
  const p1Title = options.includeLegal ? "CONTRATO Y RESUMEN DE SERVICIOS" : "PROPUESTA Y COTIZACIÓN DE SERVICIOS"
  page.drawText(p1Title, { x: (pageWidth - montserratBold.widthOfTextAtSize(p1Title, 16)) / 2, y: ctx.y, size: 16, font: montserratBold })
  ctx.y -= 40

  const capitalize = (str: string) => {
    if (!str) return str
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  drawEventHeader(ctx, "DATOS DEL EVENTO", [
    { label: "CLIENTE:", value: safeValue(data.clientName, "CLIENTE") },
    isHappening 
      ? { label: "TIPO EVENTO:", value: "Happening" }
      : { label: "TIPO VENUE:", value: capitalize(safeValue(data.venueType, "SALÓN")) },
    { label: "UBICACIÓN:", value: data.address || `${safeValue(data.street)} ${safeValue(data.houseNumber)}, ${safeValue(data.colonia)}, ${safeValue(data.municipio)}` },
    { label: "GOOGLE MAPS:", value: safeValue(data.mapsLink, "NO PROPORCIONADO") },
    { label: "FECHA:", value: formatDateSpanish(data.requestedDate) },
    { label: "HORARIO:", value: `${safeValue(data.startTime)} - ${safeValue(data.endTime)} HRS` },
  ])
  ctx.y -= 20

  const isBarPackage = data.packageId === "bar" || data.packageName?.toLowerCase().includes("bar") || data.venueType?.toLowerCase() === "bar";

  // 🚀 CARGAR INCLUSIONES DE FORMA 100% DINÁMICA DESDE LA BASE DE DATOS
  let inclusions: string[] = []
  if (data.packageId) {
    try {
      const pkg = await db.package.findUnique({
        where: { id: data.packageId },
        include: { serviceItems: { orderBy: { order: "asc" } } }
      })
      if (pkg) {
        if (pkg.serviceItems && pkg.serviceItems.length > 0) {
          inclusions = pkg.serviceItems.map((item: any) => item.name)
        } else if (pkg.includes) {
          inclusions = pkg.includes.split(",").map((inc: string) => inc.trim()).filter(Boolean)
        }
      }
    } catch (err) {
      console.error("❌ Error al cargar inclusiones del paquete de la base de datos:", err)
    }
  }

  // Fallback a las constantes estáticas si no se encontraron inclusiones en la base de datos
  if (!inclusions || inclusions.length === 0) {
    inclusions = PACKAGE_INCLUSIONS[data.packageId] 
      || (isBarPackage ? PACKAGE_INCLUSIONS["bar"] : ["Show Vendetta Rock", "Producción profesional"])
  }
  
  if (data.clientProvidesAudio) {
    inclusions = inclusions.filter(inc => !inc.toLowerCase().includes("audio") && !inc.toLowerCase().includes("sonido"))
  }

  // Personalización dinámica en la tabla
  const bandHours = data.bandHours && data.bandHours > 0 ? data.bandHours : 2
  const showDetails = [
    isBarPackage 
      ? `• Música en Vivo: 2 turnos de 45 minutos`
      : `• Música en Vivo: ${bandHours} Horas`,
    data.djHours > 0 ? `• DJ: ${data.djHours} Horas ${data.isDjWithTvs ? '(Con Pantallas)' : '(Audio)'}` : null,
    data.hasTemplete ? "• Incluye Escenario (Templete)" : null,
    data.hasPista ? "• Incluye Pista LED" : null,
    data.hasRobot ? "• Incluye Robot LED" : null
  ].filter(Boolean) as string[]

  // isHappening already defined above
  
  let tableRows: any[] = [];
  if (isHappening) {
    tableRows.push({
      no: "1",
      desc: `Servicio Artístico: Presentación de Vendetta en Vivo\n• Show musical de ${bandHours} horas con formación profesional en escena.\n• Incluye backline de la banda e ingeniería de sonido.\n• Preparación, coordinación artística, repertorio y producción musical.`,
      pu: MXN(data.packagePrice)
    });
    if (!data.clientProvidesAudio) {
      tableRows.push({
        no: String(tableRows.length + 1),
        desc: "Producción Técnica Integral de Audio e Iluminación\n• Sistema de audio profesional calibrado según la acústica y aforo del evento.\n• Microfonía profesional e instrumentación completa con monitoreo de escenario.\n• Iluminación escénica para el área de la banda.\n• Personal para montaje, desmontaje y operación técnica sonora.",
        pu: "INCLUIDO"
      });
    }

    if ((data as any).hasPantalla) {
      tableRows.push({
        no: String(tableRows.length + 1),
        desc: "Servicio Opcional: Pantalla LED de Alta Definición\n• Pantalla LED con procesador de video, soporte estructural y cableado.\n• Personal técnico para montaje, operación y desmontaje.",
        pu: "INCLUIDO"
      });
    }
    if ((data as any).hasTemplete) {
      tableRows.push({
        no: String(tableRows.length + 1),
        desc: "Servicio Opcional: Escenario / Templete Profesional\n• Templete modular con escaleras laterales, transporte, montaje y desmontaje.",
        pu: "INCLUIDO"
      });
    }
    
    if (data.viaticosAmount > 0) {
      tableRows.push({
        no: String(tableRows.length + 1),
        desc: isHappening ? "Viáticos de traslado" : (data.viaticosLabel || "Viáticos y gastos logísticos"),
        pu: MXN(data.viaticosAmount)
      });
    }
  } else {
    const packageNameDisplay = isBarPackage ? "Paquete Bar" : data.packageName
    const finalDesc = `Show Vendetta Rock — ${packageNameDisplay}\n${showDetails.join("\n")}\n${inclusions.map(i => "• " + i).join("\n")}`
    const tableRowsDefault = [{ no: "1", desc: finalDesc, pu: MXN(data.packagePrice) }]
    tableRows = tableRowsDefault
    
    if (data.discountAmount && data.discountAmount > 0) {
      tableRows.push({ 
        no: String(tableRows.length + 1), 
        desc: "Descuento especial aplicado", 
        pu: `-${MXN(data.discountAmount as number)}` 
      })
    }
    if (data.viaticosAmount > 0) tableRows.push({ no: String(tableRows.length + 1), desc: data.viaticosLabel || "Viáticos y gastos logísticos", pu: MXN(data.viaticosAmount) })
    if (extraSoundcheck > 0) tableRows.push({ no: String(tableRows.length + 1), desc: "Disponibilidad Extendida (Soundcheck)", pu: MXN(extraSoundcheck) })
  }
  if (ivaAmount > 0) tableRows.push({ no: String(tableRows.length + 1), desc: `IVA (16%) — Factura requerida`, pu: MXN(ivaAmount) })

  drawDetailedTable(ctx, tableRows)

  ctx.y -= 25
  page.drawText("IMPORTANTE:", { x: margin, y: ctx.y, size: 9, font: montserratBold, color: VENDETTA_RED })
  ctx.y -= 12
  const importantNotes = [
    "Los precios y montos cotizados son más IVA (16%).",
    "No incluye planta de luz (Toma de corriente estable requerida).",
    "Capacidad de audio limitada al número de personas cotizado.",
    "VENDETTA no se hace responsable por fallas eléctricas del inmueble."
  ]
  importantNotes.forEach(note => {
    page.drawText("• " + note, { x: margin + 10, y: ctx.y, size: 8, font: montserrat, color: rgb(0.3, 0.3, 0.3) })
    ctx.y -= 10
  })

  ctx.y -= 15
  const summaryY = ctx.y
  page.drawText("SUBTOTAL", { x: pageWidth - margin - 220, y: summaryY, size: 9, font: montserratBold })
  page.drawText(MXN(subtotal), { x: pageWidth - margin - 100, y: summaryY, size: 9, font: montserrat })

  if (ivaAmount > 0) {
    ctx.y = summaryY - 18
    page.drawText("IVA (16%)", { x: pageWidth - margin - 220, y: ctx.y, size: 9, font: montserratBold, color: rgb(0.6, 0.45, 0) })
    page.drawText(MXN(ivaAmount), { x: pageWidth - margin - 100, y: ctx.y, size: 9, font: montserrat, color: rgb(0.6, 0.45, 0) })
    ctx.y -= 12
  } else {
    ctx.y = summaryY - 30
  }

  page.drawRectangle({ x: pageWidth - margin - 230, y: ctx.y - 7, width: 230, height: 28, color: SUCCESS_GREEN })
  page.drawText("TOTAL" + (ivaAmount > 0 ? " CON IVA" : " ESTIMADO"), { x: pageWidth - margin - 220, y: ctx.y, size: 11, font: montserratBold, color: WHITE_COLOR })
  page.drawText(MXN(total), { x: pageWidth - margin - 100, y: ctx.y, size: 11, font: montserratBold, color: WHITE_COLOR })

  ctx.y -= 35
  const anticipo = data.depositAmount ?? (total * 0.5)
  const liquidacion = total - anticipo
  const pct = Math.round((anticipo / total) * 100)

  page.drawText(`ANTICIPO SOLICITADO (${pct}%): ${MXN(anticipo)}`, { x: margin, y: ctx.y, size: 9, font: montserratBold })
  ctx.y -= 15
  page.drawText(`LIQUIDACIÓN (DÍA DEL EVENTO): ${MXN(liquidacion)}`, { x: margin, y: ctx.y, size: 9, font: montserrat })
  ctx.y -= 15
  page.drawText("ESTA COTIZACIÓN TIENE UNA VIGENCIA DE 15 DÍAS NATURALES.", { x: margin, y: ctx.y, size: 7, font: montserrat, color: rgb(0.5, 0.5, 0.5) })

  if (options.includeLegal) {
    page = doc.addPage([pageWidth, pageHeight])
    ctx.page = page
    ctx.y = pageHeight - margin

    const legalTitle = "CONTRATO DE PRESTACIÓN DE SERVICIOS MUSICALES"
    page.drawText(legalTitle, { x: (pageWidth - montserratBold.widthOfTextAtSize(legalTitle, 14)) / 2, y: ctx.y, size: 14, font: montserratBold })
    ctx.y -= 35

    const introText = `CONTRATO DE PRESTACIÓN DE SERVICIOS MUSICALES QUE CELEBRAN POR UNA PARTE JOSÉ ALBERTO BAUTISTA ROMERO PAREDES (EN LO SUCESIVO “VENDETTA”) Y POR LA OTRA PARTE ${safeValue(data.clientName, "EL CLIENTE").toUpperCase()} (EN LO SUCESIVO “EL CLIENTE”), AL TENOR DE LAS SIGUIENTES DECLARACIONES Y CLÁUSULAS:`
    drawJustifiedText(ctx, introText, 8.5, 11, pageWidth - margin * 2)

    ctx.y -= 20
    const decHeader = "D E C L A R A C I O N E S"
    page.drawText(decHeader, { x: (pageWidth - montserratBold.widthOfTextAtSize(decHeader, 10)) / 2, y: ctx.y, size: 10, font: montserratBold })
    ctx.y -= 20

    const fullLegalAddress = data.address || [data.street, data.houseNumber, data.colonia, data.municipio, data.city, data.state].filter(Boolean).join(", ") || "Ubicación por confirmar"

    const decText = "I. DECLARA “VENDETTA”:\n" +
      "a) Ser una agrupación musical y artística profesional representada por José Alberto Bautista Romero Paredes con capacidad legal, técnica y operativa para prestar los servicios musicales contratados.\n" +
      "b) Que cuenta con el equipo, instrumental, personal técnico e integrantes requeridos para el cumplimiento cabal del presente contrato.\n\n" +
      "II. DECLARA “EL CLIENTE”:\n" +
      `a) Llamarse como ha quedado asentado en el presente documento (${safeValue(data.clientName, "EL CLIENTE")}) y contar con plena capacidad para celebrar y obligarse al cumplimiento del presente contrato.\n` +
      `b) Que es su voluntad contratar la presentación musical en vivo para la fecha, horario y lugar convenidos (${formatDateSpanish(data.requestedDate)} en ${fullLegalAddress}).\n\n` +
      "III. AMBAS PARTES DECLARAN:\n" +
      "Que reconocen mutuamente su personalidad y capacidad legal, manifestando que en la celebración del presente contrato no existe dolo, error, mala fe ni vicio alguno del consentimiento, sujetándose incondicionalmente al cumplimiento y observancia de las siguientes:"
    drawJustifiedText(ctx, decText, 8.0, 10.5, pageWidth - margin * 2)

    ctx.y -= 25
    const clauHeader = "C L Á U S U L A S."
    page.drawText(clauHeader, { x: (pageWidth - montserratBold.widthOfTextAtSize(clauHeader, 10)) / 2, y: ctx.y, size: 10, font: montserratBold })
    console.log("[PDF Generator] Generando documento PDF...")

    let clausesToDraw: { n: string, t: string }[] = []

    // --- CÁLCULO AUTOMÁTICO DE HORAS / TURNOS EXTRAS (SIN VIÁTICOS) ---
    const baseServicePrice = data.packagePrice || 0
    const contractedHours = data.bandHours && data.bandHours > 0 ? data.bandHours : (isBarPackage ? 1.5 : 2)
    const dynamicExtraHour = isBarPackage
      ? (baseServicePrice > 0 ? Math.round((baseServicePrice / 2) / 100) * 100 : 3500)
      : (baseServicePrice > 0 ? Math.round((baseServicePrice / (contractedHours || 2)) / 100) * 100 : 5000)
    const extraTimeLabel = isBarPackage ? "TURNO EXTRA (45 MINUTOS)" : "HORA EXTRA DE MÚSICA EN VIVO"

    const formatBankText = () => {
      const parts = []
      if (options.bankName) parts.push(`Banco ${options.bankName}`)
      if (options.bankAccount) parts.push(`Cuenta: ${options.bankAccount}`)
      if (options.bankClabe) parts.push(`CLABE: ${options.bankClabe}`)
      if (options.bankBeneficiary) parts.push(`a nombre de ${options.bankBeneficiary}`)
      if (parts.length > 0) return `medio de depósito o transferencia a ${parts.join(" ")}`
      return "medio de transferencia electrónica o depósito bancario a los datos oficiales compartidos por canal seguro"
    }
    const bankDetails = formatBankText()

    if (isHappening) {
      clausesToDraw = [
        { n: "PRIMERA", t: "DECLARA Y ACEPTA “EL CLIENTE”: Conocer el trabajo que desempeña “VENDETTA” y estar de acuerdo en su modalidad de “PRESENTACIÓN MUSICAL EN VIVO / HAPPENING”." },
        { n: "SEGUNDA", t: "DECLARA “VENDETTA”: Tener la capacidad, instrumental, equipo técnico y experiencia profesional necesaria para cumplir con el compromiso motivo de este contrato de forma cabal y con los más altos estándares artísticos." },
        { n: "TERCERA", t: `“VENDETTA” se compromete a presentarse y ejecutar el servicio contratado en el evento que se efectuará el día ${formatDateSpanish(data.requestedDate)} en el inmueble ubicado en ${fullLegalAddress}.` },
        { n: "CUARTA", t: `La actuación de “VENDETTA” será efectuada dentro del siguiente programa: ${safeValue(data.startTime)} HRS A ${safeValue(data.endTime)} HRS (${bandHours} horas de música en vivo).` },
        { 
          n: "QUINTA", 
          t: `Por esta actuación “EL CLIENTE” se compromete a pagar a “VENDETTA” la cantidad de: ${MXN(total)} (${numeroALetras(total)} pesos mexicanos) por concepto de la actuación${(data.viaticosAmount || 0) > 0 ? ` (incluyendo ${MXN(data.viaticosAmount || 0)} por concepto de viáticos y gastos logísticos foráneos)` : ""}. La cual “EL CLIENTE” se compromete a liquidar en 2 pagos: un anticipo de ${MXN(anticipo)} (${pct}%) por ${bankDetails}, y la liquidación del restante por un monto de ${MXN(liquidacion)} se realizará en efectivo el día del evento al momento en el que “VENDETTA” arribe al lugar mencionado en la tercera cláusula, antes de descargar y montar la producción. En caso de que “EL CLIENTE” opte por liquidar mediante transferencia electrónica (SPEI), dicha transferencia deberá quedar realizada, acreditada y confirmada en la cuenta bancaria de “VENDETTA” con al menos 24 horas de anticipación a la fecha del evento.`
        },
        { n: "SEXTA", t: "En caso de alternar con otro grupo (musical, mariachis, disco, protocolo, etc.), si dicho acto no respeta el horario establecido entre ambos y llegara a ocupar más tiempo del asignado, “VENDETTA” no repondrá dicho tiempo y se sujetará al horario convenido de inicio y final estipulado en el presente contrato. En caso de que el tiempo se agote por causas no imputables a “VENDETTA”, no habrá opción de reembolso y se cobrará el 100% del monto estipulado en este contrato; cualquier tiempo extendido requerirá la contratación de tiempo extra." },
        { n: "SÉPTIMA", t: "“EL CLIENTE” se compromete a poner a disposición de “VENDETTA” un espacio (mesa, sala, sillas) con servicio para sus descansos. Asimismo, “EL CLIENTE” será el único responsable de contar con el espacio adecuado para la instalación del equipo, provisto de una instalación eléctrica estable y regulada de al menos dos tomas de corriente de 110V aterrizadas a no más de 10 metros, en un circuito independiente y exclusivo (sin compartir línea con equipos de cocina, calentadores ni plantas de refrigeración). “VENDETTA” no se hace responsable por fallas o pausas derivadas de fluctuaciones de voltaje del inmueble. Queda estrictamente prohibido a los asistentes colocar vasos, botellas o líquidos sobre o a menos de un metro del equipo de audio, iluminación e instrumentos; cualquier daño o percance imputable a los asistentes o al recinto será cubierto al 100% por “EL CLIENTE” a valor de reposición inmediata, así como responder por cualquier agresión física o daño al personal de la agrupación." },
        { n: "OCTAVA", t: "“EL CLIENTE” se compromete a proporcionar a “VENDETTA” bebidas hidratantes durante el desarrollo del evento (agua, refrescos o equivalentes). El ofrecimiento de bebidas alcohólicas o cualquier otro tipo de cortesía queda a criterio exclusivo del cliente, entendiéndose que tales cortesías no constituyen obligación contractual ni condicionan la ejecución del servicio. Asimismo, “VENDETTA” manifiesta que su personal no realizará sus actividades bajo influencia de sustancias, estupefacientes o niveles inapropiados de alcohol, conservando en todo momento la capacidad óptima para el desempeño de su trabajo. Cualquier consumo voluntario por parte del personal de “VENDETTA”, dentro de los límites que no afecten la correcta ejecución del servicio, no será causa de cancelación, rescisión ni penalización contractual, salvo que se comprometa de manera evidente la integridad del evento, extremo que deberá ser objetivamente comprobable." },
        { n: "NOVENA", t: "“VENDETTA” asegura presentarse en tiempo y forma con vestimenta, limpieza y respeto profesional para el cumplimiento del evento motivo de este contrato." },
        { n: "DÉCIMA", t: "“EL CLIENTE” se obliga a proporcionar a “VENDETTA” las condiciones adecuadas para la correcta, cómoda y segura ejecución del servicio, incluyendo seguridad en el área y libre movilidad. En ningún caso “EL CLIENTE” podrá solicitar que “VENDETTA” se presente, instale u opere bajo condiciones atmosféricas adversas, exposición directa a lluvia, humedad extrema o viento, o factores que comprometan la estabilidad del equipo o el bienestar del personal. En caso de que no se cumplan las condiciones mencionadas, “VENDETTA” podrá suspender temporalmente o ajustar la prestación del servicio hasta que el área cuente con resguardo y techado adecuado, sin que ello implique responsabilidad o penalización para “VENDETTA”." },
        { n: "DÉCIMA PRIMERA", t: "Si el evento no se realizara por causas imputables a “EL CLIENTE”, éste se compromete a cubrir a “VENDETTA” el 50% del costo total del contrato por concepto de indemnización por daños y apartado de fecha. Si la cancelación fuere por causas imputables a “VENDETTA”, ésta se compromete a reembolsar el anticipo otorgado y a otorgar la opción de reagendar con un 10% de descuento sobre el monto contratado. En caso de suspensión o cancelación por Caso Fortuito o Fuerza Mayor (fenómenos meteorológicos graves, sismos, emergencias sanitarias, actos de autoridad o cortes generales de suministro eléctrico municipal ajenos a las partes), el anticipo pagado no será reembolsable en efectivo y se conservará como saldo a favor y crédito para reagendar la presentación dentro de los siguientes 180 (ciento ochenta) días naturales conforme a disponibilidad de agenda de “VENDETTA”, deduciendo únicamente los viáticos y gastos de traslado que ya se hubieren devengado efectivamente si la agrupación ya se encontraba en movilización o en el recinto." },
        { n: "DÉCIMA SEGUNDA", t: `Las partes convienen que, en caso de requerirse tiempo adicional de presentación una vez concluido el programa y existiendo condiciones operativas y de agenda, la tarifa por ${extraTimeLabel} se determina proporcionalmente con base en el valor pactado del servicio artístico (sin viáticos), fijándose en la cantidad de ${MXN(dynamicExtraHour)} (${numeroALetras(dynamicExtraHour)} pesos mexicanos) por cada ${isBarPackage ? "turno de 45 minutos" : "hora extra"}, debiendo ser autorizada y liquidada en efectivo antes de iniciar dicho tiempo adicional.` },
        { n: "DÉCIMA TERCERA", t: "“EL CLIENTE” asume expresamente el carácter de organizador del evento y será el único y exclusivo responsable de tramitar y cubrir ante las autoridades correspondientes cualquier permiso municipal, estatal o de protección civil, así como el pago de derechos de autor y licencias de ejecución pública musical ante la Sociedad de Autores y Compositores de México (SACM) o sociedad de gestión colectiva aplicable, deslindando totalmente a “VENDETTA” de cualquier pago, multa o requerimiento emitido por dichas instituciones." },
        { n: "DÉCIMA CUARTA", t: "“EL CLIENTE” autoriza a “VENDETTA” a registrar fotografía y video de la actuación musical para fines exclusivos de portafolio artístico, difusión musical y promoción en redes sociales y medios digitales de la agrupación. En caso de que “EL CLIENTE” requiera privacidad total o confidencialidad, deberá manifestarlo por escrito con anterioridad a la firma del presente contrato." },
        { n: "DÉCIMA QUINTA", t: "“VENDETTA” podrá interrumpir la presentación a criterio en el caso específico de que alguno de los miembros de la agrupación o staff sea víctima de acoso, discriminación, violencia verbal o agresión física, o bien si se registran daños a los transportes de los músicos por parte de asistentes al evento. En tales supuestos, “EL CLIENTE” deberá cubrir el 100% del monto total estipulado en este contrato como indemnización por incumplimiento de condiciones mínimas de seguridad." },
        { n: "DÉCIMA SEXTA", t: "GARANTÍA TÉCNICA Y PRODUCCIÓN SONORA: Con el objetivo de garantizar la fidelidad acústica, el balance sonoro y la más alta calidad en la ejecución artística de “VENDETTA”, el servicio incluye el equipamiento de audio profesional, microfonía y personal técnico de ingeniería que la agrupación requiere para su óptima presentación. Dicha producción técnica forma parte integral del estándar de calidad de la agrupación y no está sujeta a fraccionamiento ni deducción. En eventos masivos catalogados formalmente como “Festival”, la agrupación podrá operar con el rider técnico profesional homologado provisto por la producción del festival." },
        { n: "DÉCIMA SÉPTIMA", t: "LOGÍSTICA EXTENDIDA Y SERVICIOS FORÁNEOS: Cuando el servicio se realice fuera del área de cobertura estándar o cuando por requerimientos del evento el tiempo total de permanencia de “VENDETTA” en el lugar exceda el tiempo estándar de operación (considerando hasta 1 hora de montaje, el tiempo de show convenido y 1 hora de desmontaje), se considerará logística extendida, generando los cargos adicionales correspondientes por disponibilidad. Asimismo, cuando los traslados imposibiliten el retorno seguro inmediato, “EL CLIENTE” se obliga a proporcionar a “VENDETTA” un espacio adecuado de descanso (habitación de hotel o área acondicionada) que garantice el resguardo del equipo y descanso del personal." },
        { n: "DÉCIMA OCTAVA", t: "PRODUCCIÓN EN FESTIVALES CON RIDER HOMOLOGADO: En los casos de eventos masivos catalogados como “Festival” donde la producción externa provea el sistema de refuerzo sonoro masivo (PA principal, consolas y procesadores homologados), dicha infraestructura técnica será de la responsabilidad de la producción del festival, coordinándose el personal técnico de “VENDETTA” para su correcta operación durante la presentación." },
        { 
          n: "DÉCIMA NOVENA", 
          t: "NO EXISTENCIA DE RELACIÓN LABORAL. Las partes reconocen y aceptan que las únicas relaciones jurídicas existentes entre ellas son las derivadas del presente contrato, razón por la cual el PRESTADOR (Vendetta) es y será el único responsable ante el personal que utilice, contrate, y/o subcontrate, y que se encontrará bajo su inmediata dirección y dependencia, del cumplimiento a todas las obligaciones derivadas de las disposiciones laborales, de seguridad social, impositivas y de cualquier otra índole, vigentes y aplicables, incluyendo el pago de salarios ordinarios y extraordinarios, vacaciones, aguinaldo, prima de antigüedad, accidentes, riesgos de trabajo, reparto de utilidades, finiquitos, despidos, así como cualquier obligación aplicable derivada de la Ley Federal del Trabajo en vigor, del Instituto Mexicano del Seguro Social, del “INFONAVIT”, por lo que el PRESTADOR asume expresamente el carácter de patrón en términos de lo que se establecen los artículos 8, 10 y 20 y demás relativos y aplicables de la Ley Federal del Trabajo respecto de las personas que se encuentren comprendidas dentro del personal, para todos los efectos legales a que haya lugar. Asimismo, el PRESTADOR se obliga a defender, mantener y sacar en paz y a salvo a El Cliente en caso de cualquier reclamación laboral."
        },
        { 
          n: "VIGÉSIMA", 
          t: "Para todo lo relativo a la interpretación, cumplimiento y ejecución del presente CONTRATO, las partes se someten expresamente a la jurisdicción de las leyes y tribunales civiles de Toluca, Estado de México, renunciando a cualquier otro fuero que pudiera corresponderles. Leído que fue el presente contrato y conformes las partes en todas sus cláusulas, lo firman teniendo la misma fuerza y valor probatorio en documento físico o electrónico, bastando la firma electrónica, rastro digital o confirmación por medios digitales para hacerlo valer conforme a derecho y según lo dispuesto por el artículo 89 del Código de Comercio." 
        }
      ]
    } else if (options.contractLegalText) {
      // Si el usuario proporcionó un texto legal personalizado, realizamos los reemplazos de variables
      let rawText = options.contractLegalText

      const readableDate = data.requestedDate ? formatDateSpanish(data.requestedDate) : "Por confirmar"
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
          maximumFractionDigits: 0
        }).format(amount)
      }
      const fullLegalAddress = data.address || [data.street, data.houseNumber, data.colonia, data.municipio, data.city, data.state].filter(Boolean).join(", ") || "Ubicación por confirmar"
      
      const horarioDisplay = data.startTime && data.endTime 
        ? `${data.startTime} A ${data.endTime}`
        : (data.startTime || "Por confirmar")

      const replacements: Record<string, string> = {
        "{{cliente}}": data.clientName || "Cliente",
        "{{horario}}": horarioDisplay,
        "{{monto}}": total ? formatCurrency(total) : "Por confirmar",
        "{{paquete}}": data.packageName || "Por confirmar",
        "{{dirección}}": fullLegalAddress,
        "{{ubicación}}": fullLegalAddress,
        "{{fecha}}": readableDate
      }

      Object.entries(replacements).forEach(([key, value]) => {
        rawText = rawText.split(key).join(value)
      })

      const paragraphs = rawText.split("\n")
      clausesToDraw = paragraphs
        .filter(p => p.trim().length > 0)
        .map(p => ({ n: "", t: p }))
    } else {
      // Cláusulas por defecto (Estándar / Bar)
      clausesToDraw = [
        { n: "PRIMERA", t: "DECLARA Y ACEPTA “EL CLIENTE”: Conocer el trabajo que desempeña “VENDETTA” y estar de acuerdo en su modalidad de “BANDA DE ROCK DE COVERS EN INGLÉS Y ESPAÑOL”." },
        { n: "SEGUNDA", t: "DECLARA “VENDETTA”: Tener la capacidad, instrumental, equipo técnico y experiencia profesional necesaria para cumplir con el compromiso motivo de este contrato de forma cabal y con los más altos estándares artísticos." },
        { n: "TERCERA", t: `“VENDETTA” se compromete a presentarse y ejecutar el servicio contratado en el evento que se efectuará el día ${formatDateSpanish(data.requestedDate)} en el inmueble ubicado en ${fullLegalAddress}.` },
        { 
          n: "CUARTA", 
          t: isBarPackage 
            ? `La actuación de “VENDETTA” será efectuada dentro del siguiente programa: ${safeValue(data.startTime)} HRS A ${safeValue(data.endTime)} HRS, comprendiendo un total de 2 turnos de 45 minutos de música en vivo.`
            : `La actuación de “VENDETTA” será efectuada dentro del siguiente programa: ${safeValue(data.startTime)} HRS A ${safeValue(data.endTime)} HRS (${bandHours} horas de música en vivo).` 
        },
        { 
          n: "QUINTA", 
          t: (data.viaticosAmount || 0) > 0 
            ? (pct > 0 ? `Por esta actuación “EL CLIENTE” se compromete a pagar a “VENDETTA” la cantidad de: ${MXN(total)} (${numeroALetras(total)} pesos mexicanos) por concepto de la actuación, incluyendo la cantidad de: ${MXN(data.viaticosAmount || 0)} por concepto de viáticos y gastos logísticos foráneos. La cual “EL CLIENTE” se compromete a liquidar en 2 pagos: un anticipo del ${pct}% (${MXN(anticipo)}) por ${bankDetails}, y LA LIQUIDACIÓN DEL RESTANTE POR UN MONTO DE ${MXN(liquidacion)} SE REALIZARÁ EN EFECTIVO EL DÍA DEL EVENTO AL MOMENTO EN EL QUE “VENDETTA” ARRIBE AL LUGAR MENCIONADO EN LA TERCERA CLÁUSULA, ANTES DE DESCARGAR Y MONTAR LA PRODUCCIÓN DE LA PRESENTACIÓN. En caso de que “EL CLIENTE” opte por liquidar mediante transferencia electrónica (SPEI), dicha transferencia deberá quedar realizada, acreditada y confirmada en la cuenta bancaria de “VENDETTA” con al menos 24 horas de anticipación a la fecha del evento.`
                       : `Por esta actuación “EL CLIENTE” se compromete a pagar a “VENDETTA” la cantidad de: ${MXN(total)} (${numeroALetras(total)} pesos mexicanos) por concepto de la actuación, incluyendo la cantidad de: ${MXN(data.viaticosAmount || 0)} por concepto de viáticos y gastos logísticos foráneos. LA TOTALIDAD DEL MONTO POR ${MXN(total)} SE REALIZARÁ EN EFECTIVO EL DÍA DEL EVENTO AL MOMENTO EN EL QUE “VENDETTA” ARRIBE AL LUGAR MENCIONADO EN LA TERCERA CLÁUSULA, ANTES DE DESCARGAR Y MONTAR LA PRODUCCIÓN DE LA PRESENTACIÓN.`)
            : (pct > 0 ? `Por esta actuación “EL CLIENTE” se compromete a pagar a “VENDETTA” la cantidad de: ${MXN(total)} (${numeroALetras(total)} pesos mexicanos) por concepto de la actuación; la cual “EL CLIENTE” se compromete a liquidar en 2 pagos: un anticipo del ${pct}% (${MXN(anticipo)}) por ${bankDetails}, y LA LIQUIDACIÓN DEL RESTANTE POR UN MONTO DE ${MXN(liquidacion)} SE REALIZARÁ EN EFECTIVO EL DÍA DEL EVENTO AL MOMENTO EN EL QUE “VENDETTA” ARRIBE AL LUGAR MENCIONADO EN LA TERCERA CLÁUSULA, ANTES DE DESCARGAR Y MONTAR LA PRODUCCIÓN DE LA PRESENTACIÓN. En caso de que “EL CLIENTE” opte por liquidar mediante transferencia electrónica (SPEI), dicha transferencia deberá quedar realizada, acreditada y confirmada en la cuenta bancaria de “VENDETTA” con al menos 24 horas de anticipación a la fecha del evento.`
                       : `Por esta actuación “EL CLIENTE” se compromete a pagar a “VENDETTA” la cantidad de: ${MXN(total)} (${numeroALetras(total)} pesos mexicanos) por concepto de la actuación; LA TOTALIDAD DEL MONTO POR ${MXN(total)} SE REALIZARÁ EN EFECTIVO EL DÍA DEL EVENTO AL MOMENTO EN EL QUE “VENDETTA” ARRIBE AL LUGAR MENCIONADO EN LA TERCERA CLÁUSULA, ANTES DE DESCARGAR Y MONTAR LA PRODUCCIÓN DE LA PRESENTACIÓN.`)
        },
        { n: "SEXTA", t: "En caso de alternar con otro grupo (musical, mariachis, disco, protocolo, etc.), si dicho acto no respeta el horario establecido entre ambos y llegara a ocupar más tiempo del asignado, “VENDETTA” no repondrá dicho tiempo y se sujetará al horario convenido de inicio y final estipulado en el presente contrato. En caso de que el tiempo se agote por causas no imputables a “VENDETTA”, no habrá opción de reembolso y se cobrará el 100% del monto estipulado en este contrato; cualquier tiempo extendido requerirá la contratación de tiempo extra." },
        { n: "SÉPTIMA", t: "“EL CLIENTE” se compromete a poner a disposición de “VENDETTA” un espacio (mesa, sala, sillas) con servicio para sus descansos. Asimismo, “EL CLIENTE” será el único responsable de contar con el espacio adecuado para la instalación del equipo, provisto de una instalación eléctrica estable y regulada de al menos dos tomas de corriente de 110V aterrizadas a no más de 10 metros, en un circuito independiente y exclusivo (sin compartir línea con equipos de cocina, calentadores ni plantas de refrigeración). “VENDETTA” no se hace responsable por fallas o pausas derivadas de fluctuaciones de voltaje del inmueble. Queda estrictamente prohibido a los asistentes colocar vasos, botellas o líquidos sobre o a menos de un metro del equipo de audio, iluminación e instrumentos; cualquier daño o percance imputable a los asistentes o al recinto será cubierto al 100% por “EL CLIENTE” a valor de reposición inmediata, así como responder por cualquier agresión física o daño al personal de la agrupación." },
        { n: "OCTAVA", t: "“EL CLIENTE” se compromete a proporcionar a “VENDETTA” bebidas hidratantes durante el desarrollo del evento (agua, refrescos o equivalentes). El ofrecimiento de bebidas alcohólicas o cualquier otro tipo de cortesía queda a criterio exclusivo del cliente, entendiéndose que tales cortesías no constituyen obligación contractual ni condicionan la ejecución del servicio. Asimismo, “VENDETTA” manifiesta que su personal no realizará sus actividades bajo influencia de sustancias, estupefacientes o niveles inapropiados de alcohol, conservando en todo momento la capacidad óptima para el desempeño de su trabajo. Cualquier consumo voluntario por parte del personal de “VENDETTA”, dentro de los límites que no afecten la correcta ejecución del servicio, no será causa de cancelación, rescisión ni penalización contractual, salvo que se comprometa de manera evidente la integridad del evento, extremo que deberá ser objetivamente comprobable." },
        { n: "NOVENA", t: "“VENDETTA” asegura presentarse en tiempo y forma con vestimenta, limpieza y respeto profesional para el cumplimiento del evento motivo de este contrato." },
        { n: "DÉCIMA", t: "“EL CLIENTE” se obliga a proporcionar a “VENDETTA” las condiciones adecuadas para la correcta, cómoda y segura ejecución del servicio, incluyendo seguridad en el área y libre movilidad. En ningún caso “EL CLIENTE” podrá solicitar que “VENDETTA” se presente, instale u opere bajo condiciones atmosféricas adversas, exposición directa a lluvia, humedad extrema o viento, o factores que comprometan la estabilidad del equipo o el bienestar del personal. En caso de que no se cumplan las condiciones mencionadas, “VENDETTA” podrá suspender temporalmente o ajustar la prestación del servicio hasta que el área cuente con resguardo y techado adecuado, sin que ello implique responsabilidad o penalización para “VENDETTA”." },
        { 
          n: "DÉCIMA PRIMERA", 
          t: pct > 0
            ? "Si el evento no se realizara por causas imputables a “EL CLIENTE”, éste se compromete a cubrir a “VENDETTA” el 50% del costo total del contrato por concepto de indemnización por daños y apartado de fecha. Si la cancelación fuere por causas imputables a “VENDETTA”, ésta se compromete a reembolsar el anticipo otorgado y a otorgar la opción de reagendar con un 10% de descuento sobre el monto contratado. En caso de suspensión o cancelación por Caso Fortuito o Fuerza Mayor (fenómenos meteorológicos graves, sismos, emergencias sanitarias, actos de autoridad o cortes generales de suministro eléctrico municipal ajenos a las partes), el anticipo pagado no será reembolsable en efectivo y se conservará como saldo a favor y crédito para reagendar la presentación dentro de los siguientes 180 (ciento ochenta) días naturales conforme a disponibilidad de agenda de “VENDETTA”, deduciendo únicamente los viáticos y gastos de traslado que ya se hubieren devengado efectivamente si la agrupación ya se encontraba en movilización o en el recinto."
            : "Si el evento no se realizara por causas imputables a “EL CLIENTE”, éste se compromete a cubrir a “VENDETTA” el 50% del costo total del contrato por concepto de indemnización por daños y apartado de fecha. Si la cancelación fuere por causas imputables a “VENDETTA”, ésta se compromete a otorgar la opción de reagendar con un 10% de descuento sobre el monto contratado. En caso de suspensión o cancelación por Caso Fortuito o Fuerza Mayor (fenómenos meteorológicos graves, sismos, emergencias sanitarias, actos de autoridad o cortes generales de suministro eléctrico municipal ajenos a las partes), el evento podrá reagendarse dentro de los siguientes 180 días naturales conforme a disponibilidad de agenda de “VENDETTA”."
        },
        { n: "DÉCIMA SEGUNDA", t: `Las partes convienen que, en caso de requerirse tiempo adicional de presentación una vez concluido el programa y existiendo condiciones operativas y de agenda, la tarifa por ${extraTimeLabel} se determina proporcionalmente con base en el valor pactado del servicio artístico (sin viáticos), fijándose en la cantidad de ${MXN(dynamicExtraHour)} (${numeroALetras(dynamicExtraHour)} pesos mexicanos) por cada ${isBarPackage ? "turno de 45 minutos" : "hora extra"}, debiendo ser autorizada y liquidada en efectivo antes de iniciar dicho tiempo adicional.` },
        { n: "DÉCIMA TERCERA", t: "“EL CLIENTE” asume expresamente el carácter de organizador del evento y será el único y exclusivo responsable de tramitar y cubrir ante las autoridades correspondientes cualquier permiso municipal, estatal o de protección civil, así como el pago de derechos de autor y licencias de ejecución pública musical ante la Sociedad de Autores y Compositores de México (SACM) o sociedad de gestión colectiva aplicable, deslindando totalmente a “VENDETTA” de cualquier pago, multa o requerimiento emitido por dichas instituciones." },
        { n: "DÉCIMA CUARTA", t: "“EL CLIENTE” autoriza a “VENDETTA” a registrar fotografía y video de la actuación musical para fines exclusivos de portafolio artístico, difusión musical y promoción en redes sociales y medios digitales de la agrupación. En caso de que “EL CLIENTE” requiera privacidad total o confidencialidad, deberá manifestarlo por escrito con anterioridad a la firma del presente contrato." },
        { n: "DÉCIMA QUINTA", t: "“VENDETTA” podrá interrumpir la presentación a criterio en el caso específico de que alguno de los miembros de la agrupación o staff sea víctima de acoso, discriminación, violencia verbal o agresión física, o bien si se registran daños a los transportes de los músicos por parte de asistentes al evento. En tales supuestos, “EL CLIENTE” deberá cubrir el 100% del monto total estipulado en este contrato como indemnización por incumplimiento de condiciones mínimas de seguridad." },
        { n: "DÉCIMA SEXTA", t: "GARANTÍA TÉCNICA Y PRODUCCIÓN SONORA: Con el objetivo de garantizar la fidelidad acústica, el balance sonoro y la más alta calidad en la ejecución artística de “VENDETTA”, el servicio incluye el equipamiento de audio profesional, microfonía y personal técnico de ingeniería que la agrupación requiere para su presentación. Dicha producción técnica forma parte integral del estándar de calidad de la agrupación y no está sujeta a fraccionamiento ni deducción. En eventos masivos catalogados formalmente como “Festival”, la agrupación podrá operar con el rider técnico profesional homologado provisto por la producción del festival." },
        { n: "DÉCIMA SÉPTIMA", t: "LOGÍSTICA EXTENDIDA Y SERVICIOS FORÁNEOS: Cuando el servicio se realice fuera del área de cobertura estándar o cuando por requerimientos del evento el tiempo total de permanencia de “VENDETTA” en el lugar exceda el tiempo estándar de operación (considerando hasta 1 hora de montaje, el tiempo de show convenido y 1 hora de desmontaje), se considerará logística extendida, generando los cargos adicionales correspondientes por disponibilidad. Asimismo, cuando los traslados imposibiliten el retorno seguro inmediato, “EL CLIENTE” se obliga a proporcionar a “VENDETTA” un espacio adecuado de descanso (habitación de hotel o área acondicionada) que garantice el resguardo del equipo y descanso del personal." },
        { 
          n: "DÉCIMA OCTAVA", 
          t: "Para todo lo relativo a la interpretación, cumplimiento y ejecución del presente CONTRATO, las partes se someten expresamente a la jurisdicción de las leyes y tribunales civiles de Toluca, Estado de México, renunciando a cualquier otro fuero que pudiera corresponderles. Leído que fue el presente contrato y conformes las partes en todas sus cláusulas, lo firman teniendo la misma fuerza y valor probatorio en documento físico o electrónico, bastando la firma electrónica, rastro digital o confirmación por medios digitales para hacerlo valer conforme a derecho y según lo dispuesto por el artículo 89 del Código de Comercio." 
        }
      ]
    }

    // --- NOTA DE AUDIO Y STAFF EN FORMATO DIGITAL ---
    if (!options.contractLegalText) {
      clausesToDraw.push({
        n: "DÉCIMA NOVENA",
        t: "GARANTÍA DE AUDIO Y STAFF: Vendetta cuenta con el equipamiento técnico de audio, microfonía e ingeniería que la agrupación requiere para garantizar la máxima fidelidad acústica y calidad de ejecución en cada show. En festivales masivos se opera con el rider técnico homologado por la producción."
      })
    }

    clausesToDraw.forEach(cl => {
      if (ctx.y < 80) { ctx.page = doc.addPage([pageWidth, pageHeight]); ctx.y = pageHeight - margin }
      const prefix = cl.n ? `${cl.n}.-` : ""
      if (prefix) {
        ctx.page.drawText(prefix, { x: margin, y: ctx.y, size: 7.5, font: montserratBold })
        const prefixWidth = montserratBold.widthOfTextAtSize(prefix, 7.5) + 5
        drawJustifiedText(ctx, cl.t, 7.5, 10, pageWidth - margin * 2, margin + prefixWidth, margin)
      } else {
        drawJustifiedText(ctx, cl.t, 7.5, 10, pageWidth - margin * 2, margin, margin)
      }
      ctx.y -= 5
    })

    // --- FIRMAS ---
    ctx.y -= 25
    if (ctx.y < 100) { ctx.page = doc.addPage([pageWidth, pageHeight]); ctx.y = pageHeight - margin }

    const sw = 160
    const sy = ctx.y - 60
    
    // Firma Vendetta (Izquierda)
    if (options.adminSignature) {
      try {
        const cleanAdminSig = stripBase64Prefix(options.adminSignature)
        console.log(`[PDF Generator] Embedding admin signature. Length: ${options.adminSignature.length}, Cleaned: ${cleanAdminSig.length}`)
        
        // Convertir base64 a Uint8Array para asegurar compatibilidad con pdf-lib
        const adminSigBytes = Buffer.from(cleanAdminSig, 'base64')
        const adminSigImg = await doc.embedPng(adminSigBytes)
        
        const sigDims = adminSigImg.scale(0.35)
        ctx.page.drawImage(adminSigImg, { 
          x: margin + (sw - sigDims.width) / 2, 
          y: sy + 5, 
          width: sigDims.width, 
          height: sigDims.height 
        })
      } catch (e) { 
        console.error("❌ [PDF Generator] Error embedding admin signature:", e) 
      }
    } else {
      console.warn("[PDF Generator] No admin signature provided in options")
    }
    ctx.page.drawLine({ start: { x: margin, y: sy }, end: { x: margin + sw, y: sy }, thickness: 1 })
    
    // Centrar textos de VENDETTA (Izquierda)
    const adminLabelText = "VENDETTA LIVE MUSIC"
    const adminLabelWidth = montserratBold.widthOfTextAtSize(adminLabelText, 8)
    ctx.page.drawText(adminLabelText, { x: margin + (sw - adminLabelWidth) / 2, y: sy - 15, size: 8, font: montserratBold })
    
    const adminRepText = "REPRESENTANTE LEGAL"
    const adminRepWidth = montserrat.widthOfTextAtSize(adminRepText, 6)
    ctx.page.drawText(adminRepText, { x: margin + (sw - adminRepWidth) / 2, y: sy - 25, size: 6, font: montserrat })

    // Firma Cliente (Derecha)
    if (options.clientSignature) {
      try {
        const cleanClientSig = stripBase64Prefix(options.clientSignature)
        console.log(`[PDF Generator] Embedding client signature. Length: ${options.clientSignature.length}, Cleaned: ${cleanClientSig.length}`)
        
        const clientSigBytes = Buffer.from(cleanClientSig, 'base64')
        const clientSigImg = await doc.embedPng(clientSigBytes)
        
        const sigDims = clientSigImg.scale(0.35)
        ctx.page.drawImage(clientSigImg, { 
          x: pageWidth - margin - sw + (sw - sigDims.width) / 2, 
          y: sy + 5, 
          width: sigDims.width, 
          height: sigDims.height 
        })
      } catch (e) { 
        console.error("❌ [PDF Generator] Error embedding client signature:", e) 
      }
    } else {
      console.warn("[PDF Generator] No client signature provided in options")
    }
    ctx.page.drawLine({ start: { x: pageWidth - margin - sw, y: sy }, end: { x: pageWidth - margin, y: sy }, thickness: 1 })
    
    // Centrar y ajustar textos del CLIENTE (Derecha)
    const clientNameText = safeValue(data.clientName, "EL CLIENTE").toUpperCase()
    const clientNameLines = wrapTextRobust(clientNameText, montserratBold, 8, sw + 20)
    let lineY = sy - 15
    clientNameLines.forEach(line => {
      const lineWidth = montserratBold.widthOfTextAtSize(line, 8)
      const lineX = (pageWidth - margin - sw) + (sw - lineWidth) / 2
      ctx.page.drawText(line, { x: lineX, y: lineY, size: 8, font: montserratBold })
      lineY -= 10
    })

    if (data.clientPhone) {
      const phoneLabel = `TEL: ${data.clientPhone}`
      const phoneWidth = montserrat.widthOfTextAtSize(phoneLabel, 6)
      const phoneX = (pageWidth - margin - sw) + (sw - phoneWidth) / 2
      ctx.page.drawText(phoneLabel, { x: phoneX, y: lineY, size: 6, font: montserrat })
      lineY -= 8
    }

    if (options.signedAt) {
      const stamp = `FIRMADO DIGITALMENTE: ${options.signedAt}`
      const stampLines = wrapTextRobust(stamp, montserrat, 5, sw + 40)
      stampLines.forEach(line => {
        const lineWidth = montserrat.widthOfTextAtSize(line, 5)
        const lineX = (pageWidth - margin - sw) + (sw - lineWidth) / 2
        ctx.page.drawText(line, { x: lineX, y: lineY, size: 5, font: montserrat, color: rgb(0.5, 0.5, 0.5) })
        lineY -= 7
      })
    }
  }

  doc.getPages().forEach((p, i) => {
    const footerText = options.includeLegal 
      ? `VENDETTA ROCK — PÁGINA ${i + 1} DE ${doc.getPageCount()}`
      : `VENDETTA ROCK — PROPUESTA DE SERVICIOS — ${shortId}`
    p.drawText(footerText, { x: margin, y: 25, size: 6, font: montserrat, color: rgb(0.6, 0.6, 0.6) })
  })

  return await doc.save()
}

function formatDateSpanish(date: Date | string | null | undefined): string {
  return formatDateMX(date, "d 'de' MMMM 'de' yyyy")
}

function drawEventHeader(ctx: DrawContext, title: string, items: { label: string, value: string }[]) {
  const { page, margin, width, y, font, boldFont } = ctx
  const itemHeight = 16
  const padding = 15
  const maxWidth = width - margin * 2 - 135
  const processedItems = items.map(it => {
    const wrapped = wrapTextRobust(it.value, font, 8.5, maxWidth)
    return { label: it.label, lines: wrapped }
  })
  
  const totalLines = processedItems.reduce((acc, it) => acc + it.lines.length, 0)
  const boxH = (totalLines * itemHeight) + padding * 2
  
  page.drawRectangle({ x: margin, y: y - boxH, width: width - margin * 2, height: boxH, color: GRAY_BG, borderWidth: 0 })
  let cy = y - padding - 8
  
  processedItems.forEach(it => {
    page.drawText(it.label, { x: margin + 15, y: cy, size: 8.5, font: boldFont, color: rgb(0.3, 0.3, 0.3) })
    it.lines.forEach(line => {
      page.drawText(line, { x: margin + 120, y: cy, size: 8.5, font: font, color: BLACK_COLOR })
      cy -= itemHeight
    })
  })
  ctx.y -= boxH
}

function drawDetailedTable(ctx: DrawContext, rows: any[]) {
  const { page, margin, width, y, font, boldFont } = ctx
  const rowH = 20
  page.drawRectangle({ x: margin, y: y - rowH, width: width - margin * 2, height: rowH, color: BLACK_COLOR })
  page.drawText("NO.", { x: margin + 10, y: y - 14, size: 8, font: boldFont, color: WHITE_COLOR })
  page.drawText("DESCRIPCIÓN DEL SERVICIO", { x: margin + 40, y: y - 14, size: 8, font: boldFont, color: WHITE_COLOR })
  page.drawText("COSTO (MÁS IVA)", { x: width - margin - 110, y: y - 14, size: 8, font: boldFont, color: WHITE_COLOR })

  let cy = y - rowH
  rows.forEach(r => {
    const descLines = wrapTextRobust(r.desc, font, 7.5, width - margin * 2 - 140)
    const actualRowH = Math.max(rowH, descLines.length * 10 + 10)
    page.drawRectangle({ x: margin, y: cy - actualRowH, width: width - margin * 2, height: actualRowH, borderColor: rgb(0.92, 0.92, 0.92), borderWidth: 0.5 })
    page.drawText(r.no, { x: margin + 10, y: cy - 14, size: 7.5, font: font })
    let lY = cy - 14
    descLines.forEach(line => { page.drawText(line, { x: margin + 40, y: lY, size: 7.5, font: font }); lY -= 10 })
    page.drawText(r.pu, { x: width - margin - 80, y: cy - 14, size: 7.5, font: font })
    cy -= actualRowH
  })
  ctx.y = cy
}

function wrapTextRobust(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = []
  text.split("\n").forEach(paragraph => {
    if (!paragraph.trim()) {
      lines.push("")
      return
    }
    const words = paragraph.split(/\s+/)
    let currentLine = ""
    for (const word of words) {
      const lineWithWord = currentLine ? `${currentLine} ${word}` : word
      if (font.widthOfTextAtSize(lineWithWord, size) <= maxWidth) {
        currentLine = lineWithWord
      } else {
        if (font.widthOfTextAtSize(word, size) > maxWidth) {
          if (currentLine) {
            lines.push(currentLine)
            currentLine = ""
          }
          let temp = ""
          for (const char of word) {
            if (font.widthOfTextAtSize(temp + char, size) <= maxWidth) {
              temp += char
            } else {
              lines.push(temp)
              temp = char
            }
          }
          currentLine = temp
        } else {
          lines.push(currentLine)
          currentLine = word
        }
      }
    }
    if (currentLine) {
      lines.push(currentLine)
    }
  })
  return lines
}

/**
 * Dibuja texto justificado distribuyendo el espacio entre palabras.
 */
function drawJustifiedText(ctx: DrawContext, text: string, size: number, lH: number, maxWidth: number, fX?: number, rX?: number) {
  const paragraphs = text.split("\n")
  
  paragraphs.forEach(p => {
    const words = p.split(/\s+/)
    let currentLine: string[] = []
    let currentLineWidth = 0
    let isFirstLine = true
    
    for (let i = 0; i < words.length; i++) {
        const word = words[i]
        const wordWidth = ctx.font.widthOfTextAtSize(word, size)
        const spaceWidth = ctx.font.widthOfTextAtSize(" ", size)
        
        const effectiveStartX = isFirstLine ? (fX || ctx.margin) : (rX || ctx.margin)
        const effectiveWidth = isFirstLine ? (ctx.width - effectiveStartX - ctx.margin) : maxWidth

        if (currentLineWidth + wordWidth + (currentLine.length * spaceWidth) > effectiveWidth) {
            // Dibujar línea justificada
            renderJustifiedLine(ctx, currentLine, effectiveStartX, effectiveWidth, size, lH, false)
            currentLine = [word]
            currentLineWidth = wordWidth
            isFirstLine = false
        } else {
            currentLine.push(word)
            currentLineWidth += wordWidth
        }
    }
    // La última línea de un párrafo NO se justifica (se alinea a la izquierda)
    const lastLineStartX = isFirstLine ? (fX || ctx.margin) : (rX || ctx.margin)
    const lastLineWidth = isFirstLine ? (ctx.width - lastLineStartX - ctx.margin) : maxWidth
    renderJustifiedLine(ctx, currentLine, lastLineStartX, lastLineWidth, size, lH, true)
  })
}

function renderJustifiedLine(ctx: DrawContext, words: string[], x: number, width: number, size: number, lH: number, isLastLine: boolean) {
    if (words.length === 0) return
    if (ctx.y < 60) {
        ctx.page = ctx.doc.addPage([ctx.width, ctx.height])
        ctx.y = ctx.height - ctx.margin
    }

    if (isLastLine || words.length === 1) {
        ctx.page.drawText(words.join(" "), { x, y: ctx.y, size, font: ctx.font })
    } else {
        const totalWordsWidth = words.reduce((acc, w) => acc + ctx.font.widthOfTextAtSize(w, size), 0)
        const totalSpace = width - totalWordsWidth
        const spaceBetween = totalSpace / (words.length - 1)
        
        let currentX = x
        words.forEach((w, i) => {
            ctx.page.drawText(w, { x: currentX, y: ctx.y, size, font: ctx.font })
            currentX += ctx.font.widthOfTextAtSize(w, size) + spaceBetween
        })
    }
    ctx.y -= lH
}


function numeroALetras(n: number): string {
  const unidades = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"]
  const especiales = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"]
  const decenas = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"]
  const centenas = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"]

  function seccion(num: number): string {
    if (num === 0) return ""
    if (num === 100) return "CIEN"
    let output = ""
    const c = Math.floor(num / 100)
    const d = Math.floor((num % 100) / 10)
    const u = num % 10

    if (c > 0) output += centenas[c] + " "

    const du = num % 100
    if (du >= 10 && du <= 19) {
      output += especiales[du - 10] + " "
    } else if (du >= 21 && du <= 29) {
      output += "VEINTI" + unidades[u] + " "
    } else {
      if (d > 0) {
        output += decenas[d]
        if (u > 0) output += " Y " + unidades[u]
        output += " "
      } else if (u > 0) {
        output += unidades[u] + " "
      }
    }
    return output.trim()
  }

  const entero = Math.floor(n)
  const centavos = Math.round((n - entero) * 100)
  const strCentavos = centavos < 10 ? `0${centavos}` : `${centavos}`

  if (entero === 0) return `CERO PESOS ${strCentavos}/100 M.N.`

  let letras = ""
  const millones = Math.floor(entero / 1000000)
  const miles = Math.floor((entero % 1000000) / 1000)
  const resto = entero % 1000

  if (millones === 1) {
    letras += miles === 0 && resto === 0 ? "UN MILLÓN DE " : "UN MILLÓN "
  } else if (millones > 1) {
    letras += miles === 0 && resto === 0 ? `${seccion(millones)} MILLONES DE ` : `${seccion(millones)} MILLONES `
  }

  if (miles === 1) {
    letras += "MIL "
  } else if (miles > 1) {
    letras += `${seccion(miles)} MIL `
  }

  if (resto > 0) {
    letras += `${seccion(resto)} `
  }

  const moneda = entero === 1 && millones === 0 && miles === 0 ? "PESO" : "PESOS"
  return `${letras.trim()} ${moneda} ${strCentavos}/100 M.N.`
}
