"use client"

import { useState } from "react"
import { FunnelData } from "./FunnelWizard"
import { Button }     from "@/components/ui/button"
import { CreditCard, Building2, Banknote, Info } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Props {
  data: Partial<FunnelData>
  onNext: (d: Partial<FunnelData>) => void
  onBack: () => void
}

const MXN = (v: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v)

const PAYMENT_METHODS = [
  {
    value: "mercadopago",
    label: "Mercado Pago",
    icon:  "💳",
    desc:  "Pago inmediato con tarjeta, débito o saldo MP. + comisión bancaria.",
    badge: "En línea",
    badgeColor: "text-blue-400 bg-blue-900/40 border-blue-700/50",
  },
  {
    value: "transfer",
    label: "Transferencia Bancaria",
    icon:  "🏦",
    desc:  "SPEI a nuestra cuenta. Adjunta tu comprobante. El booking queda pendiente hasta verificación.",
    badge: "Manual",
    badgeColor: "text-yellow-400 bg-yellow-900/40 border-yellow-700/50",
  },
  {
    value: "cash",
    label: "Efectivo en persona",
    icon:  "💵",
    desc:  "Coordinamos punto de entrega. El booking se confirma al recibir el anticipo.",
    badge: "En persona",
    badgeColor: "text-green-400 bg-green-900/40 border-green-700/50",
  },
]

const DEPOSIT_PCT = 0.30  // 30% de anticipo mínimo

export default function Step4_Pago({ data, onNext, onBack }: Props) {
  const base          = (data.packagePrice ?? 0) + (data.viaticosAmount ?? 0)
  const minDeposit    = Math.ceil(base * DEPOSIT_PCT / 100) * 100  // redondear a centenas
  const [method,  setMethod]  = useState<string>(data.paymentMethod ?? "")
  const [deposit, setDeposit] = useState<number>(data.depositAmount ?? minDeposit)
  const [error,   setError]   = useState("")

  const balance = base - deposit

  function handleNext() {
    if (!method) { setError("Selecciona un método de pago."); return }
    if (deposit < minDeposit) { setError(`El anticipo mínimo es ${MXN(minDeposit)} (30%).`); return }
    onNext({ paymentMethod: method, depositAmount: deposit })
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-heading font-black text-white tracking-tight">
          Anticipo y <span className="text-primary">método de pago</span>
        </h2>
        <p className="text-muted-foreground mt-2">
          El anticipo mínimo es el 30% del total. El resto se liquida el día del evento.
        </p>
      </div>

      {/* Resumen de precios */}
      <div className="bg-card/40 border border-white/10 rounded-2xl p-5 mb-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Paquete: {data.packageName}</span>
          <span className="font-bold text-white">{MXN(data.packagePrice ?? 0)}</span>
        </div>
        {(data.viaticosAmount ?? 0) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Viáticos ({data.city})</span>
            <span className="text-yellow-300 font-bold">{MXN(data.viaticosAmount ?? 0)}</span>
          </div>
        )}
        <div className="flex justify-between text-base border-t border-white/10 pt-2">
          <span className="font-bold text-white">Total del evento</span>
          <span className="font-black text-white text-lg">{MXN(base)}</span>
        </div>
      </div>

      {/* Selector de anticipo */}
      <div className="bg-card/40 border border-white/10 rounded-2xl p-5 mb-6">
        <label className="text-sm font-bold text-white mb-4 block text-center">
          ¿Cuánto anticipo quieres dejar hoy?
        </label>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input 
              type="number"
              value={deposit}
              onChange={e => setDeposit(Number(e.target.value))}
              className="pl-7 bg-white/5 border-white/10 h-12 text-lg font-black"
            />
          </div>
          <div className="flex-1">
            <input
              type="range"
              min={minDeposit}
              max={base}
              step={100}
              value={deposit > base ? base : (deposit < minDeposit ? minDeposit : deposit)}
              onChange={e => setDeposit(parseInt(e.target.value))}
              className="w-full accent-red-600 h-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center bg-primary/10 border border-primary/30 rounded-xl p-3">
            <div className="text-xs text-muted-foreground mb-1">Anticipo</div>
            <div className="text-base font-black text-primary">{MXN(deposit)}</div>
            <div className="text-[10px] text-primary/70">{Math.round(deposit/base*100)}%</div>
          </div>
          <div className="text-center bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-xs text-muted-foreground mb-1">Resta</div>
            <div className="text-base font-black text-white">{MXN(balance)}</div>
            <div className="text-[10px] text-muted-foreground">día del evento</div>
          </div>
          <div className="text-center bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-xs text-muted-foreground mb-1">Total</div>
            <div className="text-base font-black text-white">{MXN(base)}</div>
            <div className="text-[10px] text-muted-foreground">evento completo</div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1.5 justify-center">
          <Info className="w-3 h-3" />
          Mínimo del 30% ({MXN(minDeposit)}). Puedes ingresar el monto exacto arriba.
        </p>
      </div>

      {/* Método de pago */}
      <div className="space-y-3 mb-6">
        <label className="text-sm font-bold text-white">Método de pago del anticipo</label>
        {PAYMENT_METHODS.map(pm => (
          <button
            key={pm.value}
            onClick={() => { setMethod(pm.value); setError("") }}
            className={`w-full text-left rounded-2xl border p-4 transition-all ${
              method === pm.value
                ? "border-primary bg-primary/10"
                : "border-white/10 bg-card/40 hover:border-white/25"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none">{pm.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white">{pm.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${pm.badgeColor}`}>
                    {pm.badge}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{pm.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                method === pm.value ? "border-primary bg-primary" : "border-white/30"
              }`}>
                {method === pm.value && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Info transferencia */}
      {method === "transfer" && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-4">
          <p className="text-sm font-bold text-blue-300 mb-2">Cuenta para transferencia:</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Banco:</span><span className="text-white font-bold">BBVA</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cuenta:</span><span className="text-white font-mono">299 637 6576</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">CLABE:</span><span className="text-white font-mono text-[11px]">012 700 02996376576 4</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Beneficiario:</span><span className="text-white font-bold text-[11px]">JOSÉ ALBERTO BAUTISTA ROMERO PAREDES</span></div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Envía tu comprobante por WhatsApp al completar el registro para validar tu fecha.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive mb-4 bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 border-white/15 h-12">← Atrás</Button>
        <Button onClick={handleNext} className="flex-1 font-black h-12">
          Continuar → Mis Datos
        </Button>
      </div>
    </div>
  )
}
