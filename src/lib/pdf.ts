import { FunnelData } from "@/components/funnel/FunnelWizard"
import { generateContractPdf } from "./pdf/contract-generator"

/** 
 * Versión mejorada que utiliza pdf-lib para alta fidelidad.
 */
export async function downloadContractPdf(data: FunnelData, filename: string) {
  try {
    const pdfBytes = await generateContractPdf(data, data.shortId)
    
    // Crear un Blob y trigger de descarga
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error("Error al generar PDF:", error)
    alert("Hubo un error al generar el contrato con el nuevo motor. Por favor intenta de nuevo.")
  }
}
