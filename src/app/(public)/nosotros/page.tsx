import { Button } from "@/components/ui/button"

export default function NosotrosPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <section className="bg-black py-24 md:py-32 border-b border-white/10">
        <div className="container px-4 text-center">
          <h1 className="font-heading font-black text-4xl md:text-6xl text-white uppercase tracking-widest mb-6">
            Nuestra <span className="text-primary italic">Historia</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Más que una banda, somos los creadores de las memorias más increíbles de tu vida.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 flex-1">
        <div className="container px-4">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl font-heading font-bold text-white mb-4">Experiencia. Puntualidad. Producción Total.</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Vendetta nació con una sola misión: transformar la industria del entretenimiento en eventos sociales. Estamos cansados de los mismos shows aburridos y las agrupaciones sin personalidad. Nosotros llevamos un <strong>verdadero concierto</strong> a tu boda o fiesta.
              </p>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Diez años en el sector nos han enseñado que la música no es suficiente. Se requiere una logística impecable, una producción de audio e iluminación de nivel festival y un equipo humano completamente enfocado en hacerte brillar.
              </p>
              
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pb-4">
                <li className="flex gap-2 items-center text-gray-300 font-medium">
                  <div className="bg-primary/20 p-2 rounded-full text-primary">✓</div> Montaje de Alta Gama
                </li>
                <li className="flex gap-2 items-center text-gray-300 font-medium">
                  <div className="bg-primary/20 p-2 rounded-full text-primary">✓</div> Talento Seleccionado
                </li>
                <li className="flex gap-2 items-center text-gray-300 font-medium">
                  <div className="bg-primary/20 p-2 rounded-full text-primary">✓</div> Repertorio Actualizado
                </li>
                <li className="flex gap-2 items-center text-gray-300 font-medium">
                  <div className="bg-primary/20 p-2 rounded-full text-primary">✓</div> Compromiso Absoluto
                </li>
              </ul>
              
              <Button size="lg" className="mt-8 font-bold text-lg">Hablemos de tu evento</Button>
            </div>

            <div className="flex-1">
              <div className="relative aspect-auto lg:aspect-square w-full rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-white/5">
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10" />
                <img 
                  src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=2000&auto=format&fit=crop" 
                  alt="Vendetta Band" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Identidad / Integrantes */}
      <section className="py-20 bg-black/50 border-t border-white/5">
        <div className="container px-4 text-center">
          <h2 className="text-3xl font-heading font-black text-white uppercase tracking-widest mb-12">Nuestros <span className="text-primary italic">Integrantes</span></h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {[
              { name: "Pepe Bautista", role: "Voz y Guitarra" },
              { name: "Maryx Rojas", role: "Voz" },
              { name: "Diego Piña", role: "Batería" },
              { name: "Edgar Mariaud", role: "Bajo" },
              { name: "Alex Rentería", role: "Teclado y Voz" }
            ].map((member, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-white/5 border border-primary/20 mb-4 overflow-hidden flex items-center justify-center text-primary/50 text-3xl font-heading">
                  {member.name[0]}
                </div>
                <h3 className="font-bold text-white text-lg">{member.name}</h3>
                <p className="text-sm text-primary font-medium">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cobertura */}
      <section className="py-20">
        <div className="container px-4 max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-6">Zonas de Cobertura</h2>
          <p className="text-muted-foreground leading-relaxed text-lg mb-8">
            Llevamos nuestro show musical y producción a toda la República. Regularmente amenizamos eventos en <strong>Toluca, Metepec, Ciudad de México (CDMX), Valle de Bravo, San Mateo Atenco, Querétaro, Cuernavaca y Guanajuato</strong>.
          </p>
          <Button variant="outline" className="border-primary/50 text-white">Consulta disponibilidad en tu ciudad</Button>
        </div>
      </section>
    </div>
  )
}
