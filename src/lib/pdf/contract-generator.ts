import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont, degrees } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
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

const PACKAGE_INCLUSIONS: Record<string, string[]> = {
  "61a5477c-de10-4788-a8bd-1dfa8b57d256": [
    "Audio Electro-Voice (2 tops + 1 sub + consola digital)",
    "Backline completo",
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
  ]
}

export async function generateContractPdf(data: FunnelData, shortId: string, options: { includeLegal?: boolean } = { includeLegal: true }) {
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

  const isEarlySoundcheck = data.adminNote?.toLowerCase().includes("soundcheck") || false 
  const extraSoundcheck = isEarlySoundcheck ? 2000 : 0
  // fullAddress se define abajo para evitar ReferenceError en algunos entornos de ejecución
  const baseTotal = data.packagePrice + (data.viaticosAmount || 0)
  const total = baseTotal + extraSoundcheck

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

  drawEventHeader(ctx, "DATOS DEL EVENTO", [
    { label: "CLIENTE:", value: safeValue(data.clientName, "CLIENTE") },
    { label: "TIPO VENUE:", value: safeValue(data.venueType, "SALÓN") },
    { label: "UBICACIÓN:", value: `${safeValue(data.street)} ${safeValue(data.houseNumber)}, ${safeValue(data.colonia)}, ${safeValue(data.municipio)}` },
    { label: "GOOGLE MAPS:", value: safeValue(data.mapsLink, "NO PROPORCIONADO") },
    { label: "FECHA:", value: formatDateSpanish(data.requestedDate) },
    { label: "HORARIO:", value: `${safeValue(data.startTime)} - ${safeValue(data.endTime)} HRS` },
  ])
  ctx.y -= 20

  let inclusions = PACKAGE_INCLUSIONS[data.packageId] || ["Show Vendetta Rock", "Producción profesional"]
  if (data.clientProvidesAudio) {
    inclusions = inclusions.filter(inc => !inc.toLowerCase().includes("audio") && !inc.toLowerCase().includes("sonido"))
  }
  
  const tableRows = [{ no: "1", desc: `Show Vendetta Rock — ${data.packageName}\n${inclusions.map(i => "• " + i).join("\n")}`, pu: MXN(data.packagePrice) }]
  if (data.viaticosAmount > 0) tableRows.push({ no: String(tableRows.length + 1), desc: "Viáticos y gastos logísticos", pu: MXN(data.viaticosAmount) })
  if (extraSoundcheck > 0) tableRows.push({ no: String(tableRows.length + 1), desc: "Disponibilidad Extendida (Soundcheck)", pu: MXN(extraSoundcheck) })

  drawDetailedTable(ctx, tableRows)

  ctx.y -= 25
  page.drawText("IMPORTANTE:", { x: margin, y: ctx.y, size: 9, font: montserratBold, color: VENDETTA_RED })
  ctx.y -= 12
  const importantNotes = [
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
  page.drawText(MXN(total), { x: pageWidth - margin - 100, y: summaryY, size: 9, font: montserrat })
  
  ctx.y = summaryY - 30
  page.drawRectangle({ x: pageWidth - margin - 230, y: ctx.y - 7, width: 230, height: 28, color: SUCCESS_GREEN })
  page.drawText("TOTAL ESTIMADO", { x: pageWidth - margin - 220, y: ctx.y, size: 11, font: montserratBold, color: WHITE_COLOR })
  page.drawText(MXN(total), { x: pageWidth - margin - 100, y: ctx.y, size: 11, font: montserratBold, color: WHITE_COLOR })

  ctx.y -= 35
  const anticipo = data.depositAmount || (total * 0.5)
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

    const introText = `SERVICIOS MUSICALES PROFESIONALES QUE CELEBRAN POR UNA PARTE JOSÉ ALBERTO BAUTISTA ROMERO PAREDES Y POR LA OTRA PARTE EL CLIENTE ${safeValue(data.clientName, "EL CLIENTE")} A QUIEN EN LO SUCESIVO Y PARA TODOS LOS EFECTOS LEGALES SE LE DENOMINARÁ “EL CLIENTE.”`
    drawJustifiedText(ctx, introText, 8.5, 11, pageWidth - margin * 2)

    ctx.y -= 20
    const decHeader = "D E C L A R A C I O N E S"
    page.drawText(decHeader, { x: (pageWidth - montserratBold.widthOfTextAtSize(decHeader, 10)) / 2, y: ctx.y, size: 10, font: montserratBold })
    ctx.y -= 20
    drawJustifiedText(ctx, "DECLARA Y ACEPTA “JOSÉ ALBERTO BAUTISTA ROMERO PAREDES” con RFC BARA8804PQ2 A QUIEN EN LO SUCESIVO Y PARA TODOS LOS EFECTOS LEGALES SE LE DENOMINARÁ “VENDETTA” SER REPRESENTANTE LEGAL DE “VENDETTA ROCK” Y QUE PUEDE COMPROMETERSE POR SÍ MISMO O SU REPRESENTADA A LOS FINES NECESARIOS AL TENOR DE LAS SIGUIENTES:", 8.5, 11, pageWidth - margin * 2)

    ctx.y -= 25
    const clauHeader = "C L Á U S U L A S."
    page.drawText(clauHeader, { x: (pageWidth - montserratBold.widthOfTextAtSize(clauHeader, 10)) / 2, y: ctx.y, size: 10, font: montserratBold })
    ctx.y -= 20

    const fullLegalAddress = data.address || [data.street, data.houseNumber, data.colonia, data.municipio, data.city, data.state].filter(Boolean).join(", ") || "Ubicación por confirmar"
    console.log(`[PDF Generator] Generando contrato para: ${data.clientName}, Dirección: ${fullLegalAddress}`)

    const clauses = [
      { n: "PRIMERA", t: "DECLARA Y ACEPTA “EL CLIENTE.” Conocer el trabajo que desempeña “VENDETTA” y estar de acuerdo en su modalidad de “BANDA DE ROCK DE COVERS EN INGLES Y ESPAÑOL”" },
      { n: "SEGUNDA", t: "DECLARA “VENDETTA” tener la capacidad y experiencia necesaria en términos musicales para cumplir con el compromiso motivo de este contrato de forma profesional." },
      { n: "TERCERA", t: `“VENDETTA” se compromete a tocar en el evento que se efectuará el día ${formatDateSpanish(data.requestedDate)} en ${fullLegalAddress}.` },
      { n: "CUARTA", t: `La actuación de “VENDETTA” será efectuada en el siguiente programa: ${safeValue(data.startTime)} HRS A ${safeValue(data.endTime)} HRS.` },
      { n: "QUINTA", t: `Por esta actuación “EL CLIENTE” se compromete a pagar a “VENDETTA” la cantidad de: ${MXN(total)} (${numeroALetras(total)} pesos mexicanos) por concepto de la actuación; la cual “EL CLIENTE” se compromete a liquidar en 2 pagos: un anticipo del ${pct}% (${MXN(anticipo)}) por medio de depósito bancario a: Banco BBVA CUENTA 299 637 6576 A NOMBRE DE JOSÉ ALBERTO BAUTISTA ROMERO PAREDES O POR MEDIO DE TRANSFERENCIA ELECTRÓNICA A LA CUENTA CLABE: 012 700 02996376576 4; BBVA O POR MEDIO DE DEPÓSITO EN CUALQUIER ESTABLECIMIENTO, LA LIQUIDACIÓN DEL RESTANTE POR UN MONTO DE ${MXN(liquidacion)} SE REALIZARÁ EN EFECTIVO EL DÍA DEL EVENTO EN EL MOMENTO EN EL QUE “VENDETTA” LLEGUE A LA DIRECCIÓN MENCIONADA EN LA TERCERA CLÁUSULA, ANTES DE DESCARGAR Y MONTAR LA PRODUCCIÓN DE LA PRESENTACIÓN.` },
      { n: "SEXTA", t: "En caso de alternar con otro grupo (musical, mariachis, disco, etc.), si dicho grupo no respeta el horario establecido entre ambos y llegara a ocupar más tiempo del establecido, “VENDETTA” no repondrá dicho tiempo y será sujeto a cumplir dentro del horario de inicio y final estipulado en el presente contrato. En caso de que el tiempo sea agotado no habrá opción de reembolso, VENDETTA cobrará el 100% del monto estipulado en este contrato y en caso de acordar seguir con el evento en un nuevo tiempo se tendrá que negociar un nuevo contrato." },
      { n: "SÉPTIMA", t: "“EL CLIENTE.” se compromete a poner a la disposición de “VENDETTA” un espacio (mesa, sala, silla o sillas) con servicio para sus descansos, asimismo “EL CLIENTE.” será el único responsable de contar con el espacio adecuado para la instalación del equipo, provista de la instalación eléctrica mínima, dos tomas de corriente de 110 V y como máximo 10 metros de distancia, el espacio deberá ser exclusivo para la colocación de VENDETTA por seguridad del público como para el buen desempeño de la actuación de “VENDETTA”, si por alguna razón imputable a “EL CLIENTE” o a los asistentes al evento, el equipo de VENDETTA sufre algún percance de consideración (que lo deje incapacitado para realizar su función) “EL CLIENTE” acepta cubrir el costo de la reparación o reemplazo en dado caso de que sea irreparable, del aparato, instrumento afectado o daño físico o agresión a algún miembro de la agrupación." },
      { n: "OCTAVA", t: "“EL CLIENTE” se compromete a proporcionar a “VENDETTA” bebidas hidratantes durante el desarrollo del evento (agua, refrescos o equivalentes). El ofrecimiento de bebidas alcohólicas o cualquier otro tipo de cortesía queda a criterio exclusivo del cliente, entendiéndose que tales cortesías no constituyen obligación contractual ni condicionan la ejecución del servicio. Asimismo, “VENDETTA” manifiesta que su personal no realizará sus actividades bajo influencia de sustancias, estupefacientes o niveles inapropiados de alcohol, conservando en todo momento la capacidad óptima para el desempeño de su trabajo. La existencia de cortesías por parte de “EL CLIENTE” no será interpretada como autorización o exigencia para su consumo. Cualquier consumo voluntario por parte del personal de “VENDETTA”, dentro de los límites que no afecten la correcta ejecución del servicio, no será causa de cancelación, rescisión ni penalización contractual, salvo que se comprometa de manera evidente la integridad del evento, extremo que deberá ser objetivamente comprobable." },
      { n: "NOVENA", t: "“VENDETTA” asegura presentarse en tiempo y forma con vestimenta, limpieza y respeto para el cumplimiento del evento, motivo de este contrato." },
      { n: "DÉCIMA", t: "“EL CLIENTE” se obliga a proporcionar a “VENDETTA” las condiciones adecuadas para la correcta, cómoda y segura ejecución del servicio. Esto incluye, de manera enunciativa mas no limitativa, brindar seguridad en el área designada, suficiente espacio para la instalación del equipo y libre movilidad de los integrantes, así como un entorno que no comprometa la integridad del personal ni del equipo técnico. En ningún caso “EL CLIENTE” podrá solicitar que “VENDETTA” se presente, instale o opere bajo condiciones atmosféricas adversas, riesgos de seguridad, falta de espacio, exposure directa a lluvia, humedad o viento, o cualquier otro factor que pueda perjudicar la ejecución musical, la estabilidad del equipo o el bienestar del personal, especialmente en eventos al aire libre. En caso de que no se cumplan las condiciones mencionadas, “VENDETTA” podrá suspender temporalmente o ajustar la prestación del servicio hasta que el área sea acondicionada adecuadamente, sin que ello implique responsabilidad alguna para VENDETTA." },
      { n: "DÉCIMA PRIMERA", t: "Si por algún motivo el evento citado en la cláusula primera de este contrato no se realizara por causas imputables a “EL CLIENTE”, éste mismo se compromete a pagar a “VENDETTA” el 50% del costo total de la presentación por concepto de indemnización, por daños y perjuicios ocasionados por razones de apartado de fecha y/o movilización de equipo. En el respectivo caso, si el motivo es por causas imputables a VENDETTA, ésta se compromete a realizar el reembolso del anticipo otorgado así como a volver a agendar la fecha, en caso de que “EL CLIENTE.” así lo desee, con un 10% de descuento sobre el monto del presente contrato por concepto de indemnización por daños y perjuicios ocasionados." },
      { n: "DÉCIMA SEGUNDA", t: "Las partes están de acuerdo en que una vez terminada la actuación de “VENDETTA” y si fuese necesario seguir tocando por tiempo extra y las condiciones son adecuadas, el precio por este será de $3,500.00 MN por TURNO EXTRA (Sujeta a disponibilidad de agenda)." },
      { n: "DÉCIMA TERCERA", t: "“EL CLIENTE” hace constar bajo protesta de decir verdad que la información anteriormente asentada es verídica, comprometiéndose a resarcir los daños y perjuicios que sean ocasionados con base en una falsa declaración de su parte, SOBRE TODO EN EL CASO ESPECÍFICO DE QUE DICHO CONTRATO SEA ENVIADO Y RECIBIDO POR ALGÚN MEDIO ELECTRÓNICO AJENO AL CONTROL DE “VENDETTA”; en todo caso este se reserva el derecho de hacer válida la garantía de indemnización enumerada en la cláusula DÉCIMA PRIMERA de este documento." },
      { n: "DÉCIMA CUARTA", t: "Para todo lo relativo a la interpretación, cumplimiento y ejecución en su caso del presente CONTRATO, así como para todo aquello que no esté estipulado en el mismo, “las partes” que en él intervinieron se someten a la jurisdicción y competencia de las leyes y tribunales civiles de Toluca, Estado de México, renunciado expresamente a cualquier otro fuero que por razón de su actual o futuro domicilio o, por cualquier otra causa pudiere llegar a corresponderles. Leído que fue el presente CONTRATO y estando “las partes” que en él intervinieron conformes en todas y cada una de las cláusulas que anteceden, firman por duplicado el mismo, teniendo ambos ejemplares la misma fuerza y valor de un documento original, independientemente de que dicho convenio se haya celebrado por medio de alguna otra forma de comunicación como pudiese ser el caso de envío del mismo por medio de correo electrónico, mensajería instantánea ó cualquier otro medio electrónico moderno, bastando únicamente la firma electrónica, rastro digital de envío/recepción o la confirmación por medios digitales para hacerlo valer conforme a derecho y de conformidad con lo dispuesto por el artículo 89 del Código de Comercio, quedando un ejemplar en poder de cada una de “las partes”, firmando con fecha del día en el que el anticipo es depositado y comprobado por el banco receptor y que “VENDETTA” pueda verificar." },
      { n: "DÉCIMA QUINTA", t: "“VENDETTA” podrá interrumpir la presentación a criterio en el caso específico donde alguno de los miembros de VENDETTA o staff sea molestado con motivo sexual, racial, de clase, género, violencia verbal o física, además de no respetar la seguridad en el espacio o ubicación donde se lleve a cabo la presentación, también aplica para daños a transportes de los músicos, “EL CLIENTE” deberá pagar el 100% del monto total estipulado en este contrato como indemnización, el arreglo deberá ser expuesto con “EL CLIENTE” con pruebas y a una posterior consideración de ambas partes." },
      { n: "DÉCIMA SEXTA", t: "“EL CLIENTE” Acepta al firmar este contrato que la propuesta de equipo de audio no puede ser modificada en el momento del evento, “EL CLIENTE” confirma que fue notificado sobre los alcances del montaje y está de acuerdo con el equipo de audio y backline establecido conociendo sus limitaciones. Toda modificación deberá ser solicitada 72 hrs antes del evento y deberá cumplir con el costo adicional e indirectos necesarios para poder realizar el nuevo montaje solicitado." },
      { n: "DÉCIMA SÉPTIMA", t: "LOGÍSTICA EXTENDIDA Y SERVICIOS FORÁNEOS: Cuando el servicio se realice fuera del área de cobertura sin viáticos (radio previamente establecido) o cuando, por requerimientos del evento, el tiempo total de permanencia de “VENDETTA” en el lugar exceda el tiempo estándar de operación (considerando hasta 1 hora de montaje, 2 horas de show y 1 hora de desmontaje), se considerará como logística extendida. En dichos casos, “EL CLIENTE” acepta que podrán generarse cargos adicionales por tiempo de estancia, horas extra y/o disponibilidad extendida. Asimismo, cuando la logística implique tiempos prolongados entre montaje, presentación y desmontaje, o traslados que imposibiliten el retorno inmediato, “EL CLIENTE” se obliga a proporcionar a “VENDETTA” un espacio adecuado de descanso, el cual podrá consistir en habitación de hotel, Airbnb, sala privada o área acondicionada, que garantice seguridad, comodidad y resguardo del equipo." }
    ]

    // --- CLÁUSULA EXTRA DE AUDIO (AMIGABLE) ---
    if (data.clientProvidesAudio) {
      clauses.push({
        n: "DÉCIMA OCTAVA",
        t: "RESPONSABILIDAD SONORA (EQUIPO EXTERNO): Vendetta no se hace responsable por la calidad sonora, fidelidad, estado estético ni de funcionamiento del equipo externo al no ser el que Vendetta usa o es de sus proveedores certificados. Nuestra misión es brindar el mejor show posible, y para ello dependemos de la estabilidad y desempeño de los sistemas proporcionados por terceros."
      })
    }

    clauses.forEach(cl => {
      if (ctx.y < 80) { ctx.page = doc.addPage([pageWidth, pageHeight]); ctx.y = pageHeight - margin }
      const prefix = `${cl.n}.-`
      ctx.page.drawText(prefix, { x: margin, y: ctx.y, size: 8, font: montserratBold })
      const prefixWidth = montserratBold.widthOfTextAtSize(prefix, 8) + 5
      drawJustifiedText(ctx, cl.t, 8, 11, pageWidth - margin * 2, margin + prefixWidth, margin)
      ctx.y -= 6
    })

    // --- FIRMAS ---
    ctx.y -= 40
    if (ctx.y < 120) { ctx.page = doc.addPage([pageWidth, pageHeight]); ctx.y = pageHeight - margin }

    const sw = 160
    const sy = ctx.y - 60
    ctx.page.drawLine({ start: { x: margin, y: sy }, end: { x: margin + sw, y: sy }, thickness: 1 })
    ctx.page.drawText("VENDETTA", { x: margin + 45, y: sy - 15, size: 8, font: montserratBold })
    ctx.page.drawLine({ start: { x: pageWidth - margin - sw, y: sy }, end: { x: pageWidth - margin, y: sy }, thickness: 1 })
    ctx.page.drawText("EL CLIENTE", { x: pageWidth - margin - sw + 40, y: sy - 15, size: 8, font: montserratBold })
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
  const boxH = (items.length * itemHeight) + padding * 2
  page.drawRectangle({ x: margin, y: y - boxH, width: width - margin * 2, height: boxH, color: GRAY_BG, borderWidth: 0 })
  let cy = y - padding - 8
  items.forEach(it => {
    page.drawText(it.label, { x: margin + 15, y: cy, size: 8.5, font: boldFont, color: rgb(0.3, 0.3, 0.3) })
    page.drawText(it.value, { x: margin + 120, y: cy, size: 8.5, font: font, color: BLACK_COLOR })
    cy -= itemHeight
  })
  ctx.y -= boxH
}

function drawDetailedTable(ctx: DrawContext, rows: any[]) {
  const { page, margin, width, y, font, boldFont } = ctx
  const rowH = 20
  page.drawRectangle({ x: margin, y: y - rowH, width: width - margin * 2, height: rowH, color: BLACK_COLOR })
  page.drawText("NO.", { x: margin + 10, y: y - 14, size: 8, font: boldFont, color: WHITE_COLOR })
  page.drawText("DESCRIPCIÓN DEL SERVICIO", { x: margin + 40, y: y - 14, size: 8, font: boldFont, color: WHITE_COLOR })
  page.drawText("COSTO", { x: width - margin - 80, y: y - 14, size: 8, font: boldFont, color: WHITE_COLOR })

  let cy = y - rowH
  rows.forEach(r => {
    const descLines = wrapTextForTable(r.desc, font, 7.5, width - margin * 2 - 140)
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

function wrapTextForTable(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = []
  text.split("\n").forEach(p => {
    const words = p.split(/\s+/)
    let line = ""
    for (const w of words) {
      if (font.widthOfTextAtSize(line + w + " ", size) > maxWidth) {
        lines.push(line.trim()); line = w + " "
      } else { line += w + " " }
    }
    lines.push(line.trim())
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
  // Simplificado para montos Vendetta
  const map: Record<number, string> = {
    7600: "SIETE MIL SEISCIENTOS",
    15500: "QUINCE MIL QUINIENTOS",
    25500: "VEINTICINCO MIL QUINIENTOS"
  }
  if (map[n]) return `${map[n]} PESOS 00/100 MN`
  return `${Math.floor(n)} PESOS 00/100 MN`
}
