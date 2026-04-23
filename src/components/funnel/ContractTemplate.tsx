"use client"

import React from "react"
import { FunnelData } from "./FunnelWizard"
import { formatDateMX } from "@/lib/utils"

interface Props {
  data: FunnelData
  shortId: string
}

export function ContractTemplate({ data, shortId }: Props) {
  const today = formatDateMX(new Date(), "PP").toUpperCase()

  const MXN = (v: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v)
  
  const deposit = data.depositAmount ?? 0
  const total = data.packagePrice + (data.viaticosAmount ?? 0)
  const remaining = total - deposit

  return (
    <div 
      id="contract-pdf-render"
      className="bg-white text-black p-[2cm] w-[210mm] min-h-[297mm] mx-auto font-sans text-[12px] leading-relaxed shadow-2xl"
      style={{ boxSizing: "border-box", fontFamily: 'var(--font-heading), sans-serif' }}
    >
      {/* Membrete Estilo Rock Premium */}
      <div className="border-b-4 border-black pb-4 mb-8 flex justify-between items-end">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Vendetta" className="h-16 w-auto" />
          <div>
            <h1 className="text-4xl font-black tracking-tighter m-0 uppercase leading-none">VENDETTA</h1>
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-60">Rock & Production Agency</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg m-0">FOLIO: {shortId}</p>
          <p className="text-[10px] uppercase text-gray-500">{today}</p>
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-xl font-bold uppercase underline decoration-2 underline-offset-4" style={{ color: "#800000" }}>
          CONTRATO PRESTACIÓN DE SERVICIOS “VENDETTA ROCK”
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-y-2 mb-8 border-2 border-black p-4 bg-gray-50">
        <div><span className="font-bold">CLIENTE:</span> {data.clientName}</div>
        <div><span className="font-bold">FECHA DEL EVENTO:</span> {formatDateMX(data.requestedDate, "PPPP").toUpperCase()}</div>
        <div className="col-span-2">
          <span className="font-bold">UBICACIÓN:</span> {data.street} {data.houseNumber}, {data.colonia}, {data.municipio}, {data.state}
        </div>
        <div><span className="font-bold">HORARIO:</span> {data.startTime} - {data.endTime}</div>
        <div><span className="font-bold">STATUS:</span> CONFIRMADO (ANTICIPO PAGADO)</div>
      </div>

      <table className="w-full border-collapse border-2 border-black mb-8">
        <thead>
          <tr className="bg-gray-100 uppercase text-[10px]">
            <th className="border-2 border-black p-2 text-left">No.</th>
            <th className="border-2 border-black p-2 text-left">Descripción</th>
            <th className="border-2 border-black p-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border-2 border-black p-2 text-center">1</td>
            <td className="border-2 border-black p-2 font-bold">Show Vendetta Rock / {data.packageName}</td>
            <td className="border-2 border-black p-2 text-right">{MXN(data.packagePrice)}</td>
          </tr>
          <tr>
            <td className="border-2 border-black p-2 text-center">2</td>
            <td className="border-2 border-black p-2">Producción, Backline (Batería, Amps), Staff e Ing. Audio</td>
            <td className="border-2 border-black p-2 text-right">INCLUIDO</td>
          </tr>
          {data.viaticosAmount > 0 && (
            <tr>
              <td className="border-2 border-black p-2 text-center">3</td>
              <td className="border-2 border-black p-2">Viáticos, casetas y suministros logísticos</td>
              <td className="border-2 border-black p-2 text-right">{MXN(data.viaticosAmount)}</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-bold">
            <td colSpan={2} className="border-2 border-black p-2 text-right uppercase">Total del Contrato</td>
            <td className="border-2 border-black p-2 text-right underline underline-offset-2" style={{ color: "#800000" }}>{MXN(total)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Anticipo Banner */}
      <div className="mb-8 p-4 bg-black text-white rounded flex justify-between items-center">
        <p className="m-0 font-bold">ANTICIPO RECIBIDO: {MXN(deposit)}</p>
        <p className="m-0 font-bold text-lg opacity-50">|</p>
        <p className="m-0 font-bold">LIQUIDACIÓN AL LLEGAR: {MXN(remaining)}</p>
      </div>

      <div className="space-y-4 text-justify mb-12">
        <p className="font-bold uppercase tracking-tight" style={{ color: "#800000" }}>IMPORTANTE:</p>
        <ul className="list-disc pl-5 space-y-1 italic text-[11px]">
          <li>No incluye planta de luz.</li>
          <li>Importante definir la capacidad del audio cotizado, el grupo no se hace responsable en abastecer audio adicional en el momento de instalación en el evento si fuera necesario.</li>
        </ul>

        {/* Cláusulas COMPLETAS */}
        <div className="border-t pt-4 space-y-4 text-[10.5px]">
          <p><span className="font-bold uppercase tracking-widest" style={{ color: "#800000" }}>Declaraciones</span></p>
          <p>DECLARA Y ACEPTA “JOSÉ ALBERTO BAUTISTA ROMERO PAREDES” con RFC BARA8804PQ2 A QUIEN EN LO SUCESIVO Y PARA TODOS LOS EFECTOS LEGALES SE LE DENOMINARÁ “VENDETTA” SER REPRESENTANTE LEGAL DE “VENDETTA ROCK” Y QUE PUEDE COMPROMETERSE POR SÍ MISMO O SU REPRESENTADA A LOS FINES NECESARIOS AL TENOR DE LAS SIGUIENTES:</p>
          
          <p><span className="font-bold">PRIMERA.-</span> DECLARA Y ACEPTA “EL CLIENTE. Conocer el trabajo que desempeña “VENDETTA” y estar de acuerdo en su modalidad de “BANDA DE ROCK DE COVERS EN INGLES Y ESPAÑOL”</p>
          <p><span className="font-bold">SEGUNDA.-</span> DECLARA “VENDETTA” tener la capacidad y experiencia necesaria en términos musicales para cumplir con el compromiso motivo de este contrato de forma profesional.</p>
          <p><span className="font-bold">TERCERA.-</span> “VENDETTA” se compromete a tocar en el evento que se efectuará el día {formatDateMX(data.requestedDate, "PPPP")} en {data.street} {data.houseNumber}, {data.colonia}, {data.municipio}.</p>
          <p><span className="font-bold">CUARTA.-</span> La actuación de “VENDETTA” será efectuada en el siguiente programa: {data.startTime} HRS A {data.endTime} HRS</p>
          <p><span className="font-bold">QUINTA.-</span> Por esta actuación “EL CLIENTE" se compromete a pagar a “VENDETTA” la cantidad de: {MXN(total)}. La liquidación del restante se realizará en efectivo el día del evento en el momento en el que “VENDETTA” llegue a la dirección mencionada, antes de descargar y montar la producción.</p>
          <p><span className="font-bold">SEXTA.-</span> En caso de alternar con otro grupo, si dicho grupo no respeta el horario establecido y llegara a ocupar más tiempo del establecido, “VENDETTA” no repondrá dicho tiempo y será sujeto a cumplir dentro del horario estipulado.</p>
          <p><span className="font-bold">SÉPTIMA.-</span> “EL CLIENTE.” se compromete a poner a la disposición de “VENDETTA” un espacio con servicio para sus descansos, asimismo será el único responsable de contar con el espacio adecuado provista de la instalación eléctrica mínima, dos tomas de corriente de 110 V a máximo 10 metros.</p>
          <p><span className="font-bold">OCTAVA.-</span> El ofrecimiento de bebidas alcohólicas o cualquier otro tipo de cortesía queda a criterio exclusivo del cliente. “VENDETTA” manifiesta que su personal no realizará sus actividades bajo influencia de sustancias o niveles inapropiados de alcohol.</p>
          <p><span className="font-bold">NOVENA.-</span> “VENDETTA” asegura presentarse en tiempo y forma con vestimenta, limpieza y respeto para el cumplimiento del evento.</p>
          <p><span className="font-bold">DÉCIMA.-</span> “EL CLIENTE” se obliga a proporcionar a “VENDETTA” las condiciones adecuadas para la correcta, cómoda y segura ejecución del servicio. No se operará bajo condiciones atmosféricas adversas (lluvia, exposición directa) que perjudique el equipo o personal.</p>
          <p><span className="font-bold">DÉCIMA PRIMERA.-</span> Si el evento no se realizara por causas imputables a “EL CLIENTE”, éste se compromete a pagar el 50% del costo total por concepto de indemnización. Si es por causas imputables a la banda, ésta reembolsará el anticipo.</p>
          <p><span className="font-bold">DÉCIMA SEGUNDA.-</span> El precio por TIEMPO EXTRA (sujeto a disponibilidad) será de $3,500.00 MN por turno extra.</p>
          <p><span className="font-bold">DÉCIMA TERCERA.-</span> EL CLIENTE hace constar bajo protesta de decir verdad que la información es verídica. Se reserva el derecho de indemnización en caso de falsedad.</p>
          <p><span className="font-bold">DÉCIMA CUARTA.-</span> Ambas partes se someten a la jurisdicción y competencia de las leyes y tribunales civiles de Toluca, Estado de México.</p>
          <p><span className="font-bold">DÉCIMA QUINTA.-</span> “VENDETTA” podrá interrumpir la presentación en caso de acoso, violencia verbal o física hacia los miembros de la banda o staff.</p>
          <p><span className="font-bold">DÉCIMA SEXTA.-</span> “EL CLIENTE” acepta que la propuesta de equipo de audio no puede ser modificada en el momento del evento tras haber sido notificado sobre sus alcances y limitaciones.</p>
          
          <p className="text-[9px] text-gray-500 italic mt-6 border-t pt-4">Contrato generado digitalmente con Folio {shortId}. Este documento tiene validez legal al ir acompañado del comprobante de transferencia del anticipo.</p>
        </div>
      </div>

      {/* Firmas */}
      <div className="flex justify-around items-end pt-16">
        <div className="text-center w-72 border-t-2 border-black pt-4">
          <p className="font-bold text-[11px]">JOSÉ ALBERTO BAUTISTA ROMERO</p>
          <p className="text-[10px] text-gray-500">VENDETTA (Representante Legal)</p>
          <div className="mt-2 h-12 border border-dashed border-gray-300 flex items-center justify-center text-[8px] text-gray-400">ESPACIO PARA FIRMA</div>
        </div>
        <div className="text-center w-72 border-t-2 border-black pt-4">
          <p className="font-bold text-[11px] uppercase">{data.clientName}</p>
          <p className="text-[10px] text-gray-500">EL CLIENTE</p>
          <div className="mt-2 h-12 border border-dashed border-gray-300 flex items-center justify-center text-[8px] text-gray-400">ESPACIO PARA FIRMA</div>
        </div>
      </div>
    </div>
  )
}
