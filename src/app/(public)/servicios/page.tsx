import { Button } from "@/components/ui/button"

export default function ServiciosPage() {
  const servicios = [
    {
      title: "Bodas de Lujo",
      description: "Tu gran día merece una fiesta épica. Ofrecemos paquetes que cubren desde el cocktail hasta el último minuto en la pista de baile, con repertorio personalizable.",
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000&auto=format&fit=crop",
      tag: "Sociales"
    },
    {
      title: "Eventos Corporativos",
      description: "La música perfecta para tus cenas de fin de año, aniversarios o lanzamientos. Impactamos a tus colaboradores y clientes con producciones nivel concierto.",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop",
      tag: "Empresas"
    },
    {
      title: "Fiestas Privadas",
      description: "Cumpleaños, aniversarios o cualquier pretexto para celebrar. Llevamos toda la infraestructura al jardín de tu casa o al salón de tu elección.",
      image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1000&auto=format&fit=crop",
      tag: "Privados"
    }
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-black py-24 md:py-32 border-b border-white/10">
        <div className="container px-4 text-center">
          <h1 className="font-heading font-black text-4xl md:text-6xl text-white uppercase tracking-widest mb-6">
            Nuestros <span className="text-primary italic">Servicios</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Diseñamos la banda sonora perfecta para cualquier tipo de celebración.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicios.map((src, idx) => (
              <div key={idx} className="group relative rounded-xl overflow-hidden border border-white/10 bg-card hover:border-primary/50 transition-colors">
                <div className="aspect-[4/3] w-full overflow-hidden relative">
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors z-10" />
                  <img src={src.image} alt={src.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                  <div className="absolute top-4 left-4 z-20">
                    <span className="bg-primary px-3 py-1 text-xs font-bold uppercase rounded-md text-primary-foreground">
                      {src.tag}
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold font-heading text-white mb-3">{src.title}</h3>
                  <p className="text-muted-foreground mb-6 line-clamp-3">
                    {src.description}
                  </p>
                  <Button variant="outline" className="w-full">Conoce más detalles</Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 p-10 lg:p-16 rounded-3xl bg-primary/10 border border-primary/20 text-center relative overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 blur-3xl rounded-full" />
            <h2 className="text-3xl font-black font-heading text-white uppercase tracking-widest mb-4">¿Buscas algo más específico?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8 text-lg">
              También ofrecemos servicios como DJ, Iluminación arquitectónica, Pista de baile y shows temáticos bajo diseño.
            </p>
            <Button size="lg" className="font-bold">Contáctanos ahora</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
