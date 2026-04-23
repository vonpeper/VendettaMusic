import Link from "next/link"
import { MapPin, Phone, Mail } from "lucide-react"

export function PublicFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/8">
      {/* Fondo degradado oscuro */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-black pointer-events-none" />

      <div className="relative container mx-auto px-4 pt-16 pb-8">
        {/* Grid principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-2">
            {/* Logo con contraste: texto blanco + borde rojo */}
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-black text-white text-lg">V</div>
              <div>
                <div className="font-heading font-black text-2xl text-white tracking-wider uppercase leading-none">Vendetta</div>
                <div className="text-[10px] text-primary font-bold uppercase tracking-widest">Live Music</div>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-6">
              La mejor energía y producción musical para tu evento. Convertimos tu celebración en un concierto inolvidable.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>San Mateo Atenco · Toluca · Metepec · CDMX</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                <a href="https://wa.link/6ysnkx" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  WhatsApp disponible
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                <a href="mailto:rock.vendettamx@gmail.com" className="hover:text-white transition-colors">
                  rock.vendettamx@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Menú</div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                ["Inicio", "/"],
                ["Nosotros", "/nosotros"],
                ["Servicios", "/servicios"],
                ["Paquetes", "/#paquetes"],
                ["Noticias", "/noticias"],
                ["Contacto", "/#contacto"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-white transition-colors flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Redes */}
          <div>
            <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Redes Sociales</div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="https://www.facebook.com/vendettamusica" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center text-xs">f</span>
                  Facebook
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/vendettamusica" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center text-xs">ig</span>
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://wa.link/6ysnkx" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center text-xs">wa</span>
                  WhatsApp
                </a>
              </li>
            </ul>
            <div className="mt-8">
              <Link
                href="/cotizar"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-xl transition-colors"
              >
                Cotizar Evento →
              </Link>
            </div>
          </div>
        </div>

        {/* Divider + bottom */}
        <div className="border-t border-white/8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground/50">
            © {new Date().getFullYear()} Vendetta Live Music. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground/30">
            Hecho con 🎸 en Toluca, México
          </p>
        </div>
      </div>
    </footer>
  )
}
