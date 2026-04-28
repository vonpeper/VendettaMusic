import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Aviso de Privacidad | Vendetta Live Music",
  description: "Aviso de Privacidad y uso de datos personales de Vendetta Live Music de acuerdo con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-background min-h-screen text-white pt-32 pb-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-heading font-black mb-4 tracking-tight uppercase">
          Aviso de <span className="text-primary">Privacidad</span>
        </h1>
        <p className="text-muted-foreground mb-12">
          Última actualización: {new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
        </p>

        <div className="prose prose-invert prose-red max-w-none space-y-6">
          <p>
            De conformidad con lo establecido en la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares</strong> (la "Ley"), 
            Vendetta Live Music (en adelante "Vendetta" o "Nosotros"), pone a su disposición el presente Aviso de Privacidad.
          </p>

          <h2 className="text-2xl font-bold font-heading text-white mt-12 mb-4">1. Datos Personales Recabados</h2>
          <p>
            Para llevar a cabo las finalidades descritas en el presente Aviso de Privacidad, recabaremos los siguientes datos personales:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Nombre completo</li>
            <li>Teléfono de contacto (WhatsApp)</li>
            <li>Correo electrónico</li>
            <li>Domicilio o ubicación del evento a realizarse</li>
          </ul>

          <h2 className="text-2xl font-bold font-heading text-white mt-12 mb-4">2. Finalidades del Tratamiento de Datos</h2>
          <p>
            Los datos personales que recabamos de usted los utilizaremos para las siguientes finalidades que son necesarias para el servicio que solicita:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Elaboración de cotizaciones personalizadas de nuestros servicios musicales.</li>
            <li>Generación y firma de contratos de prestación de servicios.</li>
            <li>Logística, planificación y ejecución de las presentaciones en vivo.</li>
            <li>Cobro y facturación de los servicios prestados.</li>
            <li>Atención al cliente y comunicación sobre detalles del evento.</li>
          </ul>

          <h2 className="text-2xl font-bold font-heading text-white mt-12 mb-4">3. Transferencia de Datos</h2>
          <p>
            Le informamos que sus datos personales no serán compartidos con ninguna autoridad, empresa, organización o persona distinta a nosotros 
            y serán utilizados exclusivamente para los fines señalados. Únicamente se proporcionará la ubicación del evento a nuestro equipo 
            de logística e ingenieros de audio para la debida ejecución del servicio.
          </p>

          <h2 className="text-2xl font-bold font-heading text-white mt-12 mb-4">4. Derechos ARCO</h2>
          <p>
            Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (Acceso). 
            Asimismo, es su derecho solicitar la corrección de su información personal en caso de que esté desactualizada, sea inexacta o incompleta (Rectificación); 
            que la eliminemos de nuestros registros o bases de datos cuando considere que la misma no está siendo utilizada adecuadamente (Cancelación); 
            así como oponerse al uso de sus datos personales para fines específicos (Oposición). Estos derechos se conocen como derechos ARCO.
          </p>
          <p>
            Para el ejercicio de cualquiera de los derechos ARCO, usted deberá presentar la solicitud respectiva a través del correo electrónico: <strong>rock.vendettamx@gmail.com</strong>
          </p>

          <h2 className="text-2xl font-bold font-heading text-white mt-12 mb-4">5. Cambios al Aviso de Privacidad</h2>
          <p>
            El presente aviso de privacidad puede sufrir modificaciones, cambios o actualizaciones derivadas de nuevos requerimientos legales; 
            de nuestras propias necesidades por los servicios que ofrecemos; de nuestras prácticas de privacidad; de cambios en nuestro modelo de negocio, o por otras causas.
          </p>
          <p>
            Nos comprometemos a mantenerlo informado sobre los cambios que pueda sufrir el presente aviso de privacidad, a través de nuestra página de internet vendetta.mx.
          </p>
        </div>
      </div>
    </div>
  )
}
