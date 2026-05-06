import Link from "next/link"
import { MapPin, Phone, Mail, Mic, Music, Sparkles, ChevronRight } from "lucide-react"
import { db } from "@/lib/db"


export async function PublicFooter() {
  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })

  const fbUrl = config?.facebookUrl || "https://www.facebook.com/vendettamusica"
  const igUrl = config?.instagramUrl || "https://www.instagram.com/vendettamusica"
  const ttUrl = config?.tiktokUrl || "https://www.tiktok.com/@vendetta.rock"
  const waUrl = config?.whatsappUrl || "https://wa.link/6ysnkx"

  return (
    <footer className="relative bg-[#050505] pt-24 pb-12 border-t border-white/5 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03]">
        <Mic className="absolute top-10 left-[10%] w-32 h-32 rotate-[-15deg]" />
        <Music className="absolute bottom-20 right-[15%] w-40 h-40 rotate-[12deg]" />
        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-[0.05]" />
      </div>

      {/* Subtle Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative container mx-auto px-6">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
          
          {/* Column 1: Brand Identity */}
          <div className="space-y-8">
            <Link href="/" className="inline-block group transition-transform hover:scale-105 duration-500">
              <img 
                src="/images/logo-vendetta-horizontal.png?v=4" 
                alt="Vendetta Live Music" 
                className="h-14 w-auto object-contain"
              />
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed font-medium">
              Elevamos la experiencia musical de tu evento con una producción de alto nivel y la mejor energía Rock & Pop en vivo.
            </p>
            <div className="flex gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Premium Live Experience</span>
            </div>
          </div>

          {/* Column 2: Quick Navigation */}
          <div>
            <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.4em] mb-10 relative inline-block">
              Navegación
              <span className="absolute -bottom-2 left-0 w-8 h-px bg-primary/50" />
            </h4>
            <ul className="space-y-5">
              {[
                ["Inicio", "/"],
                ["Nosotros", "/nosotros"],
                ["Servicios", "/servicios"],
                ["Paquetes", "/#paquetes"],
                ["Fechas", "/noticias"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-gray-400 hover:text-white hover:translate-x-2 transition-all flex items-center gap-3 group">
                    <ChevronRight className="w-3 h-3 text-primary/30 group-hover:text-primary transition-colors" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact & Logistics */}
          <div>
            <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.4em] mb-10 relative inline-block">
              Contacto
              <span className="absolute -bottom-2 left-0 w-8 h-px bg-primary/50" />
            </h4>
            <div className="space-y-6">
              <div className="flex items-start gap-4 group cursor-default">
                <div className="mt-1 w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">Ubicación</span>
                  <span className="text-sm text-gray-400 font-medium">Toluca · CDMX · Valle de Bravo</span>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="mt-1 w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">WhatsApp Directo</span>
                  <a href={waUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 font-medium hover:text-white transition-colors">
                    Solicitar Cotización
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="mt-1 w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">Email</span>
                  <a href="mailto:rock.vendettamx@gmail.com" className="text-sm text-gray-400 font-medium hover:text-white transition-colors">
                    rock.vendettamx@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Column 4: Social & Engagement */}
          <div className="lg:pl-8">
            <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.4em] mb-10 relative inline-block">
              Comunidad
              <span className="absolute -bottom-2 left-0 w-8 h-px bg-primary/50" />
            </h4>
            <p className="text-xs text-gray-500 mb-8 font-medium italic">
              "Vive la Vendetta en redes sociales y no te pierdas nuestras próximas fechas."
            </p>
            <div className="flex gap-3 mb-10">
              {[
                { icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>, href: fbUrl },
                { icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>, href: igUrl },
                { icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.28 6.28 0 005.4 15.6a6.28 6.28 0 006.28 6.28A6.28 6.28 0 0018 15.6V8.12a8.14 8.14 0 004 1.05V5.72a4.46 4.46 0 01-2.41-.99V6.69z"/></svg>, href: ttUrl },
              ].map((social, idx) => (
                <a key={idx} href={social.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-primary/20 hover:border-primary/40 transition-all duration-300">
                  {social.icon}
                </a>
              ))}
            </div>
            <Link
              href="/cotizar"
              className="group relative flex items-center justify-center gap-3 bg-white text-black font-black text-[10px] uppercase tracking-widest px-8 py-5 rounded-2xl hover:bg-primary hover:text-white transition-all duration-500 shadow-xl shadow-primary/10 overflow-hidden"
            >
              <span className="relative z-10">Cotizar mi Evento</span>
              <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </Link>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-40 hover:opacity-100 transition-opacity duration-700">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} Vendetta Music Group. All rights reserved.
          </p>
          <div className="flex gap-8">
             <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Live Music</span>
             <span className="text-[10px] font-bold uppercase tracking-[0.3em]">High Production</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
