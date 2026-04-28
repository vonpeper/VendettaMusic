import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Términos y Condiciones | Vendetta Live Music",
  description: "Términos y condiciones de contratación de servicios musicales, pagos, anticipos y cancelaciones.",
}

export default function TermsPage() {
  return (
    <div className="bg-background min-h-screen text-white pt-32 pb-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-heading font-black mb-4 tracking-tight uppercase">
          Términos y <span className="text-primary">Condiciones</span>
        </h1>
        <p className="text-muted-foreground mb-12">
          Políticas de Contratación de Servicios Musicales
        </p>

        <div className="prose prose-invert prose-red max-w-none space-y-6">
          <p>
            Al solicitar una cotización y confirmar la contratación de los servicios de Vendetta Live Music (en adelante "Vendetta" o "La Banda"), 
            el Cliente acepta íntegramente los siguientes términos y condiciones.
          </p>

          <h2 className="text-2xl font-bold font-heading text-white mt-12 mb-4">1. Reservación y Pagos</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Para bloquear de manera definitiva la fecha del evento, es requerido un <strong>anticipo</strong> equivalente al porcentaje o monto acordado en la cotización.</li>
            <li>La fecha <strong>no está reservada</strong> hasta que se haya confirmado la recepción del depósito o transferencia y el Cliente haya recibido su recibo formal.</li>
            <li>El monto restante (finiquito) deberá ser cubierto a más tardar <strong>el mismo día del evento antes del montaje</strong> o según lo estipulado en el contrato privado, si lo hubiese.</li>
          </ul>

          <h2 className="text-2xl font-bold font-heading text-white mt-12 mb-4">2. Requisitos de Logística y Montaje</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>El equipo de Vendetta requiere acceso al lugar del evento al menos <strong>2 horas antes</strong> del inicio programado para el correcto montaje y prueba de sonido.</li>
            <li>El Cliente o el lugar del evento deberá proveer una toma de corriente eléctrica independiente y regulada de al menos 110V. La Banda no se hace responsable por interrupciones causadas por fallas en el suministro eléctrico del venue.</li>
            <li><strong>Planta de luz:</strong> No está incluida en ningún paquete base a menos que se especifique lo contrario. Es responsabilidad del lugar o del cliente garantizar la energía.</li>
            <li>La Banda requiere un espacio seguro, techado (en caso de lluvia o riesgo climático) y una superficie plana y estable (preferentemente templete) para la instalación del equipo. Si el clima pone en riesgo la integridad de los equipos o el personal, La Banda se reserva el derecho de detener el montaje hasta asegurar las condiciones óptimas.</li>
          </ul>

          <h2 className="text-2xl font-bold font-heading text-white mt-12 mb-4">3. Políticas de Audio</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>El equipo de audio presupuestado por defecto está calculado para un aforo estándar (hasta 100 personas). Es responsabilidad del Cliente informar la cantidad real de invitados.</li>
            <li>La banda <strong>no se hace responsable por falta de cobertura sonora</strong> si la cantidad de invitados o la dimensión del lugar supera la capacidad del audio contratado y no se solicitó un upgrade preventivo.</li>
          </ul>

          <h2 className="text-2xl font-bold font-heading text-white mt-12 mb-4">4. Política de Cancelación y Reprogramación</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>En caso de cancelación por parte del Cliente, el anticipo <strong>no es reembolsable</strong> bajo ninguna circunstancia, ya que dicho monto cubre el bloqueo de la fecha e indemnización por pérdida de oportunidad de otros eventos.</li>
            <li>En caso de requerir reprogramar el evento, se permitirá cambiar la fecha sin costo adicional si la notificación se realiza con un mínimo de <strong>60 días de anticipación</strong> y la nueva fecha está disponible en la agenda de La Banda. De lo contrario, se considerará una cancelación.</li>
            <li>En caso de fuerza mayor (desastre natural, emergencias sanitarias emitidas por el gobierno) que impidan la realización del evento, el anticipo podrá quedar a favor del Cliente para reprogramar en un periodo máximo de 1 año.</li>
          </ul>

          <h2 className="text-2xl font-bold font-heading text-white mt-12 mb-4">5. Viáticos y Alimentación</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Para eventos fuera del área metropolitana del Valle de Toluca, se aplicará un cargo adicional por concepto de viáticos (transporte y logística), el cual se detallará en la cotización inicial.</li>
            <li>Es costumbre y cortesía del Cliente proveer hidratación básica y un menú sencillo para el personal (músicos y staff) durante su permanencia en el lugar.</li>
          </ul>

          <p className="mt-12 text-sm text-muted-foreground italic">
            Para dudas sobre estas políticas o solicitar una copia física del contrato de prestación de servicios, contáctenos en rock.vendettamx@gmail.com
          </p>
        </div>
      </div>
    </div>
  )
}
