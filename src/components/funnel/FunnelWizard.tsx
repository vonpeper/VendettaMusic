"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RockBackground } from "./RockBackground"
import Step1_Paquete  from "./Step1_Paquete"
import Step2_Ubicacion from "./Step2_Ubicacion"
import Step3_Fecha    from "./Step3_Fecha"
import Step4_Pago     from "./Step4_Pago"
import Step5_Registro from "./Step5_Registro"
import FunnelSuccess  from "./FunnelSuccess"
import { trackGoogleEvent } from "@/components/public/GoogleAnalytics"

export interface FunnelData {
  // Step 1
  packageId:   string
  packageName: string
  packagePrice: number
  baseLocalPrice?: number
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
  distanceKm?:    number
  durationSec?:   number
  tollCost?:      number
  fuelCost?:      number
  requiresManualQuote?: boolean
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
  originalPrice?: number
  // Promo
  promoCode?: string
  discountAmount?: number
  // Result
  bookingId:   string
  shortId:     string
  isPublic?:   boolean
  clientProvidesAudio?: boolean
  invoice?:             boolean
  vehicleType?:         string
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
  extras?: any[]
  initialStep?:  number
  initialPkgId?: string
  initialCity?:  string
  viaticosConfig?: {
    zona2Rate?: number
    zona3Rate?: number
    zona2Cities?: string
    zona3Cities?: string
  }
  paymentConfig?: {
    payMercadoPagoActive: boolean
    payTransferenciaActive: boolean
    payPersonalActive: boolean
    payStripeActive: boolean
  }
}

export default function FunnelWizard({ packages, extras = [], initialStep = 0, initialPkgId, initialCity, viaticosConfig, paymentConfig }: WizardProps) {
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

  useEffect(() => {
    try {
      trackGoogleEvent("funnel_started", {
        step: initialStep + 1,
        initial_package_id: initialPkgId || null,
        initial_city: initialCity || null,
      })
    } catch {
      // Ignorar silenciosamente si los rastreadores están bloqueados
    }
  }, [])

  function next(partial: Partial<FunnelData>) {
    const updated = { ...data, ...partial }
    setData(updated)

    // Telemetría GA4 del embudo de cotización
    try {
      if (step === 0) {
        // Paso 1: Selección de paquete y configuración base
        trackGoogleEvent("view_item", {
          item_id: partial.packageId || updated.packageId,
          item_name: partial.packageName || updated.packageName,
          value: partial.packagePrice || updated.packagePrice,
          currency: "MXN",
        })
        trackGoogleEvent("funnel_step_package", {
          step: 1,
          package_id: partial.packageId || updated.packageId,
          package_name: partial.packageName || updated.packageName,
          guest_count: partial.guestCount ?? updated.guestCount,
          band_hours: partial.bandHours ?? updated.bandHours,
        })
      } else if (step === 1) {
        // Paso 2: Selección de ubicación y cálculo de viáticos
        trackGoogleEvent("funnel_step_event_details", {
          step: 2,
          municipio: partial.municipio || updated.municipio,
          city: partial.city || updated.city,
          state: partial.state || updated.state,
          is_outside_zone: partial.isOutsideZone ?? updated.isOutsideZone,
          viaticos_amount: partial.viaticosAmount ?? updated.viaticosAmount,
        })
      } else if (step === 2) {
        // Paso 3: Selección de fecha, horarios y servicios adicionales (addons)
        trackGoogleEvent("funnel_step_addons", {
          step: 3,
          requested_date: partial.requestedDate || updated.requestedDate,
          start_time: partial.startTime || updated.startTime,
          end_time: partial.endTime || updated.endTime,
          has_pantalla: updated.hasPantalla,
          has_robot: updated.hasRobot,
          has_pista: updated.hasPista,
          has_templete: updated.hasTemplete,
        })
      } else if (step === 3) {
        // Paso 4: Revisión de cotización preliminar y anticipo
        const totalEst = (updated.packagePrice ?? 0) + (updated.viaticosAmount ?? 0)
        trackGoogleEvent("begin_checkout", {
          step: 4,
          value: totalEst,
          currency: "MXN",
          deposit_amount: partial.depositAmount ?? updated.depositAmount,
          payment_method: partial.paymentMethod || updated.paymentMethod,
        })
      } else if (step === 4) {
        // Paso 5: Envío final del formulario y generación de lead
        const totalFinal = (updated.packagePrice ?? 0) + (updated.viaticosAmount ?? 0)
        trackGoogleEvent("generate_lead", {
          step: 5,
          booking_id: partial.bookingId || updated.bookingId,
          short_id: partial.shortId || updated.shortId,
          value: totalFinal,
          currency: "MXN",
          package_name: updated.packageName,
        })
        trackGoogleEvent("booking_submitted", {
          booking_id: partial.bookingId || updated.bookingId,
          short_id: partial.shortId || updated.shortId,
          package_name: updated.packageName,
          payment_method: updated.paymentMethod,
        })
      }
    } catch (err) {
      console.warn("[FunnelWizard] Error al emitir telemetría GA4:", err)
    }

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
                extras={extras}
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
                paymentConfig={paymentConfig}
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
