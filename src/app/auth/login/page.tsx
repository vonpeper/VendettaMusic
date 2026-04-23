"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useActionState } from "react"
import { loginAction } from "@/actions/auth"
import { AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)

  return (
    <div className="bg-card/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
      <h2 className="text-2xl font-bold font-heading text-white mb-2 text-center">Bienvenido de vuelta</h2>
      <p className="text-muted-foreground text-center mb-8 text-sm">Ingresa tus credenciales para acceder a tu panel.</p>
      
      {state && !state.success && (
        <div className="mb-6 p-3 bg-destructive/20 border border-destructive/50 rounded-lg flex items-center gap-3 text-destructive-foreground text-sm">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p>{state.message}</p>
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-300">Correo electrónico</Label>
          <Input 
            id="email" 
            name="email"
            type="email" 
            placeholder="ej. cliente@ejemplo.com" 
            className="bg-background/50 border-white/10 focus-visible:border-primary placeholder:text-muted-foreground/50" 
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-gray-300">Contraseña</Label>
            <Link href="/auth/recuperar" className="text-xs text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input 
            id="password" 
            name="password"
            type="password" 
            placeholder="••••••••" 
            className="bg-background/50 border-white/10 focus-visible:border-primary placeholder:text-muted-foreground/50" 
            required
          />
        </div>
        
        <Button type="submit" className="w-full font-bold shadow-lg" size="lg" disabled={isPending}>
          {isPending ? "Verificando..." : "Iniciar Sesión"}
        </Button>
      </form>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/auth/registro" className="text-primary font-bold hover:underline">
          Regístrate aquí
        </Link>
      </div>
    </div>
  )
}
