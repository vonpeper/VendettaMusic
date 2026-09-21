import Link from "next/link"
import Image from "next/image"
import { MapPin, Phone, Mail, Mic, Music, Sparkles, ChevronRight } from "lucide-react"
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon"
import { db } from "@/lib/db"


export async function PublicFooter() {
  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })

  const fbUrl = config?.facebookUrl || "https://www.facebook.com/vendettamusica"
  const igUrl = config?.instagramUrl || "https://www.instagram.com/vendettamusica"
  const ttUrl = config?.tiktokUrl || "https://www.tiktok.com/@vendetta.rock"
  const waUrl = config?.whatsappUrl || "https://wa.link/6ysnkx"

  return (
    <footer className="relative bg-gradient-to-b from-[#07080D] via-[#15152B]/80 to-[#42112D] pt-24 pb-12 border-t border-white/10 overflow-hidden text-[#F2F0EB]">
      {/* Decorative Background Elements & concert glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03]">
        <Mic className="absolute top-10 left-[10%] w-32 h-32 rotate-[-15deg]" />
        <Music className="absolute bottom-20 right-[15%] w-40 h-40 rotate-[12deg]" />
        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-[0.05]" />
      </div>

      {/* Stage light glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#6F0D2B]/20 blur-[140px] rounded-full pointer-events-none" />

      <div className="relative container mx-auto px-6">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
          
          {/* Column 1: Brand Identity */}
          <div className="space-y-8">
            <Link href="/" className="inline-block group transition-transform hover:scale-105 duration-500">
              <Image 
                src="/images/logo-vendetta-horizontal.png" 
                alt="Vendetta Live Music" 
                width={200}
                height={56}
                sizes="200px"
                className="h-14 w-auto object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
              />
            </Link>
            <p className="text-[#F2F0EB]/70 text-sm leading-relaxed font-normal">
              Elevamos la experiencia musical de tu evento con una producción de alto nivel y la mejor energía Pop & Rock en vivo.
            </p>
            <div className="flex gap-3 items-center">
               <div className="w-2 h-2 rounded-full bg-[#FF5A5F] shadow-[0_0_8px_#FF5A5F] animate-pulse" />
               <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#F2F0EB]/60">Tour Level Live Experience</span>
            </div>
          </div>

          {/* Column 2: Quick Navigation */}
          <div>
            <h4 className="text-[11px] font-semibold text-[#FF5A5F] uppercase tracking-[0.35em] mb-10 relative inline-block">
              Navegación
              <span className="absolute -bottom-2 left-0 w-8 h-[2px] bg-[#FF5A5F]/60" />
            </h4>
            <ul className="space-y-4">
              {[
                ["Inicio", "/"],
                ["Servicios", "/servicios"],
                ["Paquetes", "/#paquetes"],
                ["Fechas", "/noticias"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-[#F2F0EB]/70 hover:text-white hover:translate-x-2 transition-all flex items-center gap-3 group font-normal">
                    <ChevronRight className="w-3.5 h-3.5 text-[#FF5A5F]/50 group-hover:text-[#FF5A5F] transition-colors" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact & Logistics */}
          <div>
            <h4 className="text-[11px] font-semibold text-[#FF5A5F] uppercase tracking-[0.35em] mb-10 relative inline-block">
              Contacto
              <span className="absolute -bottom-2 left-0 w-8 h-[2px] bg-[#FF5A5F]/60" />
            </h4>
            <div className="space-y-5">
              <div className="flex items-start gap-4 group cursor-default">
                <div className="mt-0.5 w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#FF5A5F]/15 group-hover:border-[#FF5A5F]/30 transition-all">
                  <MapPin className="w-3.5 h-3.5 text-[#FF5A5F]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#F2F0EB]/40 font-semibold uppercase tracking-widest mb-0.5">Ubicación</span>
                  <span className="text-sm text-[#F2F0EB]/80 font-normal">Toluca · CDMX · Valle de Bravo</span>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="mt-0.5 w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#FF5A5F]/15 group-hover:border-[#FF5A5F]/30 transition-all">
                  <Phone className="w-3.5 h-3.5 text-[#FF5A5F]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#F2F0EB]/40 font-semibold uppercase tracking-widest mb-0.5">WhatsApp Directo</span>
                  <a href={waUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#F2F0EB]/80 font-normal hover:text-[#FF5A5F] transition-colors">
                    Solicitar Cotización
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="mt-0.5 w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#FF5A5F]/15 group-hover:border-[#FF5A5F]/30 transition-all">
                  <Mail className="w-3.5 h-3.5 text-[#FF5A5F]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#F2F0EB]/40 font-semibold uppercase tracking-widest mb-0.5">Email</span>
                  <a href="mailto:rock.vendettamx@gmail.com" className="text-sm text-[#F2F0EB]/80 font-normal hover:text-[#FF5A5F] transition-colors">
                    rock.vendettamx@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Column 4: Social & Engagement */}
          <div className="lg:pl-6">
            <h4 className="text-[11px] font-semibold text-[#FF5A5F] uppercase tracking-[0.35em] mb-10 relative inline-block">
              Comunidad
              <span className="absolute -bottom-2 left-0 w-8 h-[2px] bg-[#FF5A5F]/60" />
            </h4>
            <p className="text-xs text-[#F2F0EB]/60 mb-6 font-normal">
              Sigue la energía de los shows y conoce nuestras próximas fechas.
            </p>
            <div className="flex gap-3 mb-8">
              {[
                { icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>, href: fbUrl },
                { icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>, href: igUrl },
                { icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.28 6.28 0 005.4 15.6a6.28 6.28 0 006.28 6.28A6.28 6.28 0 0018 15.6V8.12a8.14 8.14 0 004 1.05V5.72a4.46 4.46 0 01-2.41-.99V6.69z"/></svg>, href: ttUrl },
                { icon: <WhatsAppIcon className="w-4 h-4 fill-current" />, href: waUrl },
              ].map((social, idx) => (
                <a key={idx} href={social.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F2F0EB]/60 hover:text-[#25D366] hover:bg-[#25D366]/10 hover:border-[#25D366]/30 transition-all duration-300">
                  {social.icon}
                </a>
              ))}
            </div>
            <Link
              href="/#paquetes"
              className="group relative flex items-center justify-center gap-2 bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-[#F2F0EB] font-semibold text-xs uppercase tracking-widest px-6 py-4 rounded-xl shadow-lg shadow-[#FF5A5F]/20 hover:shadow-[#FF5A5F]/40 hover:scale-[1.02] transition-all duration-300 border border-white/20"
            >
              <span>Cotizar mi Evento</span>
              <ChevronRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 text-[#F2F0EB]/40 hover:text-[#F2F0EB]/70 transition-colors duration-300">
          <p className="text-[10px] font-normal uppercase tracking-[0.25em]">
            © {new Date().getFullYear()} Vendetta Live Music. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
             <Link href="/aviso-privacidad" className="text-[10px] font-normal uppercase tracking-[0.25em] hover:text-[#FF5A5F] transition-colors">
               Aviso de Privacidad
             </Link>
             <Link href="/terminos-condiciones" className="text-[10px] font-normal uppercase tracking-[0.25em] hover:text-[#FF5A5F] transition-colors">
               Términos y Condiciones
             </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
