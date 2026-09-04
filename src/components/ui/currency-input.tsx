"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number | string | null | undefined
  onChange: (value: number | null) => void
  allowNegative?: boolean
  prefix?: string
}

export function CurrencyInput({
  value,
  onChange,
  allowNegative = false,
  prefix = "$",
  className,
  placeholder = "$0.00",
  disabled,
  ...props
}: CurrencyInputProps) {
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [editingText, setEditingText] = useState<string>("")

  // Formateo cuando no tiene foco
  let formattedDisplay = ""
  if (value !== null && value !== undefined && value !== "") {
    const num = Number(value)
    if (!isNaN(num)) {
      formattedDisplay = num.toLocaleString("es-MX", {
        minimumFractionDigits: num % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      })
    }
  }

  const displayValue = isFocused ? editingText : formattedDisplay

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    setIsFocused(true)
    if (value !== null && value !== undefined && value !== "" && !isNaN(Number(value))) {
      const num = Number(value)
      setEditingText(num === 0 ? "" : String(num))
    } else {
      setEditingText("")
    }
    props.onFocus?.(e)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value
    raw = raw.replace(prefix, "").trim()
    if (!allowNegative) {
      raw = raw.replace(/-/g, "")
    }

    const cleanChars: string[] = []
    let hasDot = false

    for (let i = 0; i < raw.length; i++) {
      const char = raw[i]
      if (char >= "0" && char <= "9") {
        cleanChars.push(char)
      } else if (char === "." && !hasDot) {
        cleanChars.push(char)
        hasDot = true
      } else if (char === "-" && i === 0 && allowNegative) {
        cleanChars.push(char)
      }
    }

    const cleaned = cleanChars.join("")
    setEditingText(cleaned)

    if (cleaned === "" || cleaned === "-") {
      onChange(null)
    } else {
      const parsed = parseFloat(cleaned)
      onChange(!isNaN(parsed) ? parsed : null)
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    setIsFocused(false)
    if (editingText === "" || editingText === "-") {
      onChange(null)
    } else {
      const parsed = parseFloat(editingText)
      if (!isNaN(parsed)) {
        const finalNum = allowNegative ? parsed : Math.max(0, parsed)
        onChange(finalNum)
      } else {
        onChange(null)
      }
    }
    props.onBlur?.(e)
  }

  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3 text-muted-foreground text-sm font-semibold pointer-events-none select-none">
          {prefix}
        </span>
      )}
      <Input
        {...props}
        type="text"
        inputMode="decimal"
        disabled={disabled}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder.replace(prefix, "").trim()}
        className={cn(
          prefix ? "pl-7" : "",
          "font-mono text-sm tracking-tight",
          className
        )}
      />
    </div>
  )
}
