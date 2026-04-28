"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"

interface ConfigFormWrapperProps {
  action: (prevState: any, formData: FormData) => Promise<{ success: boolean; message: string }>
  children: React.ReactNode
  className?: string
}

export function ConfigFormWrapper({ action, children, className }: ConfigFormWrapperProps) {
  const [state, formAction, isPending] = useActionState(action, null)

  useEffect(() => {
    if (state) {
      if (state.success) {
        toast.success(state.message)
      } else {
        toast.error(state.message)
      }
    }
  }, [state])

  return (
    <form action={formAction} className={className}>
      {/* 
         Pasamos isPending como prop si los hijos son funciones, 
         o simplemente renderizamos los hijos. 
      */}
      {children}
    </form>
  )
}
