"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PackagesManager } from "./PackagesManager"
import { ExtrasManager } from "./ExtrasManager"
import { ServicesManager } from "./ServicesManager"
import { updatePackageAction } from "@/actions/packages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sparkles, Package, Settings, Music2, ClipboardList, Loader2, Check } from "lucide-react"
import { toast } from "sonner"

interface ServiceItem {
  id: string
  name: string
  category: string
  icon: string | null
  description: string | null
  order: number
  active: boolean
}

interface PackageType {
  id: string
  name: string
  baseCostPerHour: number
  minDuration: number
  maxDuration: number
  description: string | null
  includes: string | null
  active: boolean
  isCustom: boolean | null
  serviceItems: ServiceItem[]
}

interface Extra {
  id: string
  name: string
  description: string | null
  setupCost: number
  hourlyCost: number
  active?: boolean
}

interface AdminPaquetesClientProps {
  initialPackages: PackageType[]
  serviceCatalog: ServiceItem[]
  initialExtras: Extra[]
}

export function AdminPaquetesClient({
  initialPackages,
  serviceCatalog,
  initialExtras
}: AdminPaquetesClientProps) {
  // Separar los paquetes base del paquete "Arma tu show"
  const basePackages = initialPackages.filter(
    p => !p.isCustom && !p.name.toLowerCase().includes("arma")
  )
  
  const initialCustomPkg = initialPackages.find(
    p => p.isCustom || p.name.toLowerCase().includes("arma")
  ) || {
    id: "custom",
    name: "Arma tu show",
    baseCostPerHour: 4000,
    minDuration: 2,
    maxDuration: 5,
    description: "Personaliza tu evento",
    includes: "",
    active: true,
    isCustom: true,
    serviceItems: []
  }

  const [customPkg, setCustomPkg] = useState(initialCustomPkg)
  const [loading, setLoading] = useState(false)

  async function handleSaveCustomConfig() {
    setLoading(true)
    const res = await updatePackageAction(customPkg.id, {
      name: customPkg.name,
      baseCostPerHour: customPkg.baseCostPerHour,
      minDuration: customPkg.minDuration,
      maxDuration: customPkg.maxDuration,
      description: customPkg.description,
      active: customPkg.active
    })
    
    if (res.success) {
      toast.success("Configuración de Arma tu Show guardada con éxito")
    } else {
      toast.error(res.error || "Error al actualizar la configuración")
    }
    setLoading(false)
  }

  return (
    <Tabs defaultValue="base-packages" className="space-y-8">
      {/* Selector de Pestañas Premium */}
      <TabsList className="bg-[#0a0a0a]/50 p-1 rounded-2xl border border-border/30 w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
        <TabsTrigger 
          value="base-packages" 
          className="rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
        >
          <Package className="w-4 h-4 mr-2 inline-block" /> Paquetes Base
        </TabsTrigger>
        <TabsTrigger 
          value="customization" 
          className="rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
        >
          <Settings className="w-4 h-4 mr-2 inline-block" /> Personalización
        </TabsTrigger>
        <TabsTrigger 
          value="catalog" 
          className="rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
        >
          <ClipboardList className="w-4 h-4 mr-2 inline-block" /> Catálogo de Inclusiones
        </TabsTrigger>
      </TabsList>

      {/* Pestaña 1: Paquetes Base */}
      <TabsContent value="base-packages" className="space-y-6 outline-none">
        <PackagesManager 
          initialPackages={basePackages as any} 
          serviceCatalog={serviceCatalog as any}
        />
      </TabsContent>

      {/* Pestaña 2: Personalización (Arma tu Show) */}
      <TabsContent value="customization" className="space-y-10 outline-none">
        
        {/* Configuración de la Banda */}
        <Card className="bg-card/30 border border-border/40 shadow-lg rounded-2xl">
          <CardHeader className="bg-muted/20 border-b border-border/10 p-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Music2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-white uppercase tracking-wider">Tarifa y Límites de la Banda</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Configura la tarifa por hora y el rango de duración del show musical en vivo (Banda).
                  </CardDescription>
                </div>
              </div>
              
              <Button 
                onClick={handleSaveCustomConfig} 
                disabled={loading}
                className="gap-2 text-white h-10 px-5 font-bold text-xs uppercase tracking-wider w-full sm:w-auto"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Guardar Configuración
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Costo por Hora (Banda)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">$</span>
                  <Input 
                    type="number"
                    value={customPkg.baseCostPerHour}
                    onChange={e => setCustomPkg({...customPkg, baseCostPerHour: parseFloat(e.target.value) || 0})}
                    className="pl-7 bg-background h-10 text-sm font-semibold w-full border border-border/80 focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mínimo de Horas</Label>
                <Input 
                  type="number"
                  value={customPkg.minDuration}
                  onChange={e => setCustomPkg({...customPkg, minDuration: parseInt(e.target.value) || 0})}
                  className="bg-background h-10 text-sm font-semibold w-full border border-border/80 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Máximo de Horas</Label>
                <Input 
                  type="number"
                  value={customPkg.maxDuration || 5}
                  onChange={e => setCustomPkg({...customPkg, maxDuration: parseInt(e.target.value) || 0})}
                  className="bg-background h-10 text-sm font-semibold w-full border border-border/80 focus:border-primary"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-background/20 cursor-pointer hover:bg-background/40 transition-all select-none h-10">
                  <input 
                    type="checkbox"
                    checked={customPkg.active}
                    onChange={e => setCustomPkg({...customPkg, active: e.target.checked})}
                    className="rounded border-border bg-background text-primary focus:ring-primary w-4.5 h-4.5"
                  />
                  <span className="text-xs font-bold text-foreground">Disponible en Web</span>
                </label>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Manager de Extras (DJ, Equipamiento, Pista, Audio upgrades) */}
        <ExtrasManager initialExtras={initialExtras} />
      </TabsContent>

      {/* Pestaña 3: Catálogo Maestro de Servicios */}
      <TabsContent value="catalog" className="space-y-6 outline-none">
        <ServicesManager initialServices={serviceCatalog as any} />
      </TabsContent>
    </Tabs>
  )
}
