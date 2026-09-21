"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, X, CheckCircle2, Loader2, MessageSquareHeart } from "lucide-react"
import { submitReviewAction } from "@/actions/reviews"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function ReviewModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [stars, setStars] = useState(5)
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    formData.append("stars", stars.toString())
    // event is handled by formData automatically if named correctly
    
    const result = await submitReviewAction(formData)
    
    setLoading(false)
    if (result.error) {
      alert(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
        setStars(5)
      }, 2500)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="mt-12 group relative overflow-hidden rounded-full font-bold focus:outline-none focus:ring-4 focus:ring-[#FF5A5F]/20 
          bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-[#F2F0EB] hover:opacity-95 shadow-lg shadow-[#6F0D2B]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 w-full sm:w-auto h-14 px-8 text-sm uppercase tracking-widest flex items-center justify-center gap-2 mx-auto cursor-pointer"
      >
         <MessageSquareHeart className="w-5 h-5" /> Déjanos una reseña
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-gradient-to-b from-[#15152B] via-[#0E0E1A] to-[#07080D] border border-white/15 rounded-3xl w-full max-w-lg p-6 md:p-8 relative shadow-2xl shadow-black/90"
            >
              <button
                onClick={() => !loading && setIsOpen(false)}
                disabled={loading}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              {success ? (
                <div className="flex flex-col items-center justify-center p-8 text-center h-64">
                  <CheckCircle2 className="w-16 h-16 text-[#FF5A5F] mb-4" />
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">¡Mil gracias!</h3>
                  <p className="text-[#F2F0EB]/70">Tu testimonio ha sido publicado. Significa el mundo para nosotros.</p>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2 text-center md:text-left">
                    ¿Qué tal <span className="text-gradient-encore italic">tu experiencia?</span>
                  </h3>
                  <p className="text-[#F2F0EB]/70 text-sm mb-8 text-center md:text-left">
                    Tus palabras nos ayudan a seguir dando el 1000% en cada show de la gira.
                  </p>

                  <form action={handleSubmit} className="space-y-6">
                    <div className="flex flex-col items-center mb-4">
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((starValue) => (
                          <button
                            key={starValue}
                            type="button"
                            onMouseEnter={() => setHoveredStar(starValue)}
                            onMouseLeave={() => setHoveredStar(null)}
                            onClick={() => setStars(starValue)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-9 h-9 transition-all ${
                                starValue <= (hoveredStar ?? stars)
                                  ? "fill-[#FF5A5F] text-[#FF5A5F] drop-shadow-[0_0_12px_rgba(255,90,95,0.6)]"
                                  : "text-white/20"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs text-[#FF5A5F] uppercase font-bold tracking-widest mt-4">
                         {stars === 5 ? "¡Excelente!" : stars === 4 ? "Muy bueno" : stars === 3 ? "Bueno" : stars === 2 ? "Regular" : "Malo"}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <Input
                        name="name"
                        placeholder="Tu Nombre o el de tu Evento"
                        required
                        disabled={loading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#FF5A5F]/50 uppercase text-xs font-bold tracking-widest rounded-xl"
                      />

                      <Input
                        name="event"
                        placeholder="¿Qué evento fue? (ej. Boda en Valle)"
                        disabled={loading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#FF5A5F]/50 uppercase text-xs font-bold tracking-widest rounded-xl"
                      />
                      
                      <Textarea
                        name="text"
                        placeholder="Escribe aquí tu testimonio..."
                        required
                        disabled={loading}
                        rows={4}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#FF5A5F]/50 text-sm resize-none rounded-xl"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-[#F2F0EB] hover:opacity-95 rounded-xl py-6 font-bold uppercase tracking-widest text-xs h-auto shadow-xl shadow-[#6F0D2B]/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        "Publicar Reseña"
                      )}
                    </Button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
