"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrencyMXN, QuoteTotalsResult } from "@/lib/pricing"
import { Receipt } from "lucide-react"

interface FinancialSummaryProps {
  totals: QuoteTotalsResult
  isPriceModified?: boolean
  invoice?: boolean
}

export function FinancialSummary({ totals, isPriceModified = false, invoice = false }: FinancialSummaryProps) {
  return (
    <Card className="bg-card border-border sticky top-6 shadow-2xl">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-white flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-primary" /> Resumen Financiero
          </span>
          {invoice && (
            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
              Facturado (+16% IVA)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3 text-sm">
        <div className="flex justify-between items-center text-muted-foreground">
          <span className="flex items-center gap-1.5">
            Precio Base Show
            {isPriceModified && (
              <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.2 rounded font-bold">
                Ajustado
              </span>
            )}
          </span>
          <span className="font-mono text-white font-medium">
            {formatCurrencyMXN(totals.basePrice)}
          </span>
        </div>

        {totals.viaticosAmount > 0 && (
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Viáticos de Traslado</span>
            <span className="font-mono text-white font-medium">
              +{formatCurrencyMXN(totals.viaticosAmount)}
            </span>
          </div>
        )}

        {totals.additionalItemsTotal > 0 && (
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Conceptos Adicionales</span>
            <span className="font-mono text-white font-medium">
              +{formatCurrencyMXN(totals.additionalItemsTotal)}
            </span>
          </div>
        )}

        {totals.discountAmount > 0 && (
          <div className="flex justify-between items-center text-emerald-400">
            <span>Descuento Especial</span>
            <span className="font-mono font-medium">
              -{formatCurrencyMXN(totals.discountAmount)}
            </span>
          </div>
        )}

        <div className="pt-2 border-t border-border/40 flex justify-between items-center font-semibold text-white">
          <span>Subtotal</span>
          <span className="font-mono">{formatCurrencyMXN(totals.subtotal)}</span>
        </div>

        {invoice && (
          <div className="flex justify-between items-center text-muted-foreground">
            <span>IVA (16%)</span>
            <span className="font-mono text-white">+{formatCurrencyMXN(totals.ivaAmount)}</span>
          </div>
        )}

        <div className="pt-3 border-t border-border/60 flex justify-between items-baseline">
          <span className="text-base font-black text-white uppercase tracking-tight">Total Evento</span>
          <span className="text-xl font-black text-primary font-mono">
            {formatCurrencyMXN(totals.totalAmount)}
          </span>
        </div>

        <div className="pt-3 border-t border-border/40 space-y-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Anticipo Apartado</span>
            <span className="font-mono text-white font-semibold">
              {formatCurrencyMXN(totals.depositAmount)}
            </span>
          </div>

          <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/5 border border-white/5">
            <span className="text-xs font-bold uppercase tracking-wider text-white">Saldo Pendiente</span>
            <span className="font-mono font-black text-base text-yellow-400">
              {formatCurrencyMXN(totals.balanceAmount)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
