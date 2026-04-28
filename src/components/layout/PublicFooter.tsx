import Link from "next/link"
import { MapPin, Phone, Mail } from "lucide-react"
import { db } from "@/lib/db"

export async function PublicFooter() {
  const config = await db.globalConfig.findUnique({ where: { id: "singleton" } })

  const fbUrl = config?.facebookUrl || "https://www.facebook.com/vendettamusica"
  const igUrl = config?.instagramUrl || "https://www.instagram.com/vendettamusica"
  const ttUrl = config?.tiktokUrl || "https://www.tiktok.com/@vendetta.rock"
  const waUrl = config?.whatsappUrl || "https://wa.link/6ysnkx"

  return (
    <footer className="relative bg-black pt-20 pb-10 border-t border-white/5">
      <div className="relative container mx-auto px-4">
        {/* Grid principal: 5 columnas en LG para que quede todo en una fila */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-16">

          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-black text-white text-lg">V</div>
              <div>
                <div 
                  className="text-2xl text-white tracking-widest uppercase leading-none"
                  style={{ fontFamily: "var(--font-advent), sans-serif", fontWeight: 500 }}
                >
                  Vendetta
                </div>
                <div className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Live Music</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-8">
              La mejor energía y producción musical para tu evento. Convertimos tu celebración en un concierto inolvidable.
            </p>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-primary" />
                <span>San Mateo Atenco · Toluca · CDMX</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary" />
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Contactar por WhatsApp
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary" />
                <a href="mailto:rock.vendettamx@gmail.com" className="hover:text-white transition-colors">
                  rock.vendettamx@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6">Navegación</div>
            <ul className="space-y-4 text-sm text-gray-400">
              {[
                ["Inicio", "/"],
                ["Acerca de la banda", "/nosotros"],
                ["Espectáculos", "/servicios"],
                ["Paquetes & Precios", "/#paquetes"],
                ["Fechas en Vivo", "/noticias"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legales */}
          <div>
            <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6">Políticas</div>
            <ul className="space-y-4 text-sm text-gray-400">
              <li>
                <Link href="/aviso-privacidad" className="hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
                   <span className="w-1 h-1 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
                   Aviso de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos-condiciones" className="hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
                   <span className="w-1 h-1 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
                   Términos y Condiciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Redes & CTA */}
          <div>
            <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6">Social</div>
            <ul className="flex gap-4 mb-8">
              <li>
                <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary hover:border-primary transition-all">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              </li>
              <li>
                <a href={igUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary hover:border-primary transition-all">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
                </a>
              </li>
              <li>
                <a href={ttUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary hover:border-primary transition-all">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.28 6.28 0 005.4 15.6a6.28 6.28 0 006.28 6.28A6.28 6.28 0 0018 15.6V8.12a8.14 8.14 0 004 1.05V5.72a4.46 4.46 0 01-2.41-.99V6.69z"/></svg>
                </a>
              </li>
              <li>
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary hover:border-primary transition-all">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
              </li>
            </ul>
            <Link
              href="/cotizar"
              className="group inline-flex items-center gap-2 bg-white/5 hover:bg-primary border border-white/10 hover:border-primary text-white font-black text-xs uppercase tracking-widest px-6 py-4 rounded-xl transition-all"
            >
              Cotizar Evento <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* Divider + bottom */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600 font-medium">
            © {new Date().getFullYear()} Vendetta Live Music. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-600 font-medium uppercase tracking-widest">
              Rock & Pop En Vivo
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
