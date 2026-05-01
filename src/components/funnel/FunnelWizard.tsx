"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RockBackground } from "./RockBackground"
import Step1_Paquete  from "./Step1_Paquete"
import Step2_Ubicacion from "./Step2_Ubicacion"
import Step3_Fecha    from "./Step3_Fecha"
import Step4_Pago     from "./Step4_Pago"
import Step5_Registro from "./Step5_Registro"
import FunnelSuccess  from "./FunnelSuccess"

export interface FunnelData {
  // Step 1
  packageId:   string
  packageName: string
  packagePrice: number
  packageIncludes?: string
  guestCount:  number
  venueType:   string
  // Custom Show Options
  bandHours:   number
  djHours:     number
  isDjWithTvs: boolean
  hasTemplete: boolean
  hasPista:    boolean
  hasRobot:    boolean
  hasPantalla: boolean
  // Step 2
  street:       string
  houseNumber:  string
  colonia:      string
  zipCode?:     string
  municipio:    string
  address:      string // Legacy or full
  city:         string // Legacy
  state:        string
  isOutsideZone: boolean
  viaticosAmount: number
  viaticosLabel:  string
  mapsLink?:     string
  // Step 3
  requestedDate: string
  startTime:     string
  endTime:       string
  // Step 4
  paymentMethod: string
  depositAmount: number
  // Step 5 (Registro)
  clientName:  string
  clientPhone: string
  clientEmail: string
  // Promo
  promoCode?: string
  discountAmount?: number
  // Result
  bookingId:   string
  shortId:     string
  isPublic?:   boolean
  clientProvidesAudio?: boolean
}

const STEPS = [
  "Paquete",
  "Ubicación",
  "Fecha",
  "Anticipo",
  "Datos",
]

interface PkgOption {
  id: string
  name: string
  baseCostPerHour: number
  minDuration: number
  description: string | null
  includes: string | null
}

interface WizardProps {
  packages: PkgOption[]
  initialStep?:  number
  initialPkgId?: string
  initialCity?:  string
  viaticosConfig?: {
    zona2Rate?: number
    zona3Rate?: number
  }
}

export default function FunnelWizard({ packages, initialStep = 0, initialPkgId, initialCity, viaticosConfig }: WizardProps) {
  // If coming from "Show Personalizado" we pre-select the package and jump to step
  const preselectedPkg = initialPkgId
    ? packages.find(p => p.id === initialPkgId)
    : undefined

  const [step, setStep] = useState(initialStep)
  const [data, setData] = useState<Partial<FunnelData>>({
    guestCount: 100,
    bandHours: 2,
    djHours: 0,
    isDjWithTvs: false,
    hasTemplete: false,
    hasPista: false,
    hasRobot: false,
    hasPantalla: false,
    state: "Estado de México",
    zipCode: "",
    city: initialCity ?? "",
    ...(preselectedPkg ? {
      packageId:   preselectedPkg.id,
      packageName: preselectedPkg.name,
      packagePrice: preselectedPkg.baseCostPerHour * preselectedPkg.minDuration,
      packageIncludes: preselectedPkg.includes ?? "",
    } : {}),
  })

  function next(partial: Partial<FunnelData>) {
    setData(prev => ({ ...prev, ...partial }))
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  function back() { 
    setStep(s => Math.max(0, s - 1))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const totalSteps = STEPS.length

  if (step >= totalSteps) {
    return (
      <>
        <RockBackground />
        <FunnelSuccess data={data as FunnelData} />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-16 relative pt-20">
      <RockBackground />
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Progress bar */}
        <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-white">
                Paso <span className="text-primary">{step + 1}</span> de {totalSteps}
              </span>
              <span className="text-sm font-bold text-primary">{STEPS[step]}</span>
            </div>
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i < step ? "bg-primary" : i === step ? "bg-primary/70" : "bg-white/10"
                }`} />
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 pt-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {step === 0 && (
              <Step1_Paquete
                packages={packages}
                data={data}
                onNext={next}
              />
            )}
            {step === 1 && (
              <Step2_Ubicacion
                data={data}
                onNext={next}
                onBack={back}
                viaticosConfig={viaticosConfig}
              />
            )}
            {step === 2 && (
              <Step3_Fecha
                data={data}
                onNext={next}
                onBack={back}
              />
            )}
            {step === 3 && (
              <Step4_Pago
                data={data}
                onNext={next}
                onBack={back}
              />
            )}
            {step === 4 && (
              <Step5_Registro
                data={data}
                onNext={next}
                onBack={back}
              />
            )}
          </motion.div>
        </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
