"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Plus, Trash2, Layers } from "lucide-react"
import { AdditionalLineItem } from "@/lib/pricing"

interface QuoteLineItemsProps {
  items: AdditionalLineItem[]
  onChange: (items: AdditionalLineItem[]) => void
}

export function QuoteLineItems({ items, onChange }: QuoteLineItemsProps) {
  function handleAddItem() {
    onChange([
      ...items,
      {
        id: "item-" + Math.random().toString(36).substring(2, 7),
        description: "",
        quantity: 1,
        unitCost: 0
      }
    ])
  }

  function handleUpdateItem(index: number, patch: Partial<AdditionalLineItem>) {
    const next = [...items]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  function handleRemoveItem(index: number) {
    const next = items.filter((_, i) => i !== index)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-primary" /> Conceptos Adicionales de Producción
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          className="text-xs h-7 gap-1 border-dashed cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Agregar Concepto
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center text-xs text-muted-foreground">
          Sin conceptos adicionales agregados. Presiona "Agregar Concepto" para sumar horas extras, iluminación robótica, pantallas o audio extendido.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="grid grid-cols-12 gap-2 p-2.5 rounded-xl bg-card border border-border items-center"
            >
              <div className="col-span-12 sm:col-span-6">
                <Input
                  value={item.description}
                  onChange={e => handleUpdateItem(idx, { description: e.target.value })}
                  placeholder="Descripción (ej. 1 Hora Extra de Show, Pantalla LED...)"
                  className="h-9 text-xs"
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Input
                  type="number"
                  min="1"
                  value={item.quantity || 1}
                  onChange={e => handleUpdateItem(idx, { quantity: parseInt(e.target.value) || 1 })}
                  placeholder="Cant."
                  className="h-9 text-xs text-center"
                />
              </div>
              <div className="col-span-5 sm:col-span-3">
                <CurrencyInput
                  value={item.unitCost}
                  onChange={val => handleUpdateItem(idx, { unitCost: val || 0 })}
                  placeholder="Precio Unitario"
                  className="h-9 text-xs"
                />
              </div>
              <div className="col-span-3 sm:col-span-1 flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="p-2 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
