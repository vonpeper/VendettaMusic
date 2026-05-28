"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MusicianCard } from "./MusicianCard"
import { CoverageMatrix } from "./CoverageMatrix"
import { MusicianDetailsSheet } from "./MusicianDetailsSheet"
import { AddMusicianForm } from "./MusicianActions"
import { Search, Mic, Headphones, Settings } from "lucide-react"

export function BandaClientView({ initialMusicians }: { initialMusicians: any[] }) {
  const [search, setSearch] = useState("")
  const [selectedMusicianId, setSelectedMusicianId] = useState<string | null>(null)
  
  const selectedMusician = initialMusicians.find(m => m.id === selectedMusicianId)
  
  const searchMatched = initialMusicians.filter(m =>
    (m.user?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (m.instrument && m.instrument.toLowerCase().includes(search.toLowerCase()))
  )

  const activeMatched = searchMatched.filter(m => m.status === 'active')
  const inactiveMatched = searchMatched.filter(m => m.status === 'inactive')

  const musiciansOnly = activeMatched.filter(m => 
    !["Ingeniero de Audio", "Técnico", "Staff", "Proveedor"].includes(m.instrument || "")
  )
  
  const engineers = activeMatched.filter(m => 
    m.instrument === "Ingeniero de Audio"
  )

  const staffTech = activeMatched.filter(m => 
    ["Técnico", "Staff", "Proveedor"].includes(m.instrument || "")
  )

  return (
    <div>
      <Tabs defaultValue="tarjetas" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <TabsList className="bg-card border border-border/40">
            <TabsTrigger value="tarjetas">Vista Tarjetas</TabsTrigger>
            <TabsTrigger value="matriz">Matriz de Cobertura</TabsTrigger>
            <TabsTrigger value="inactivos">Inactivos</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Buscar por nombre o rol..." 
                className="w-full pl-9 pr-4 py-2 bg-card border border-border/40 rounded-md text-sm text-foreground focus:outline-none focus:border-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <AddMusicianForm />
          </div>
        </div>

        <TabsContent value="tarjetas" className="mt-0 space-y-12">
          {/* SECCIÓN MÚSICOS */}
          <div>
            <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-3 px-4 py-2 bg-card border-l-4 border-primary rounded-r-xl shadow-md">
                <Mic className="w-4 h-4 text-primary" />
                <h2 className="text-[12px] font-black uppercase tracking-[0.25em] text-foreground">Titulares y Músicos</h2>
              </div>
              <div className="h-px flex-1 bg-border/40" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {musiciansOnly.map(musician => (
                <MusicianCard 
                  key={musician.id} 
                  musician={musician} 
                  onViewDetails={() => setSelectedMusicianId(musician.id)} 
                />
              ))}
            </div>
          </div>

          {/* SECCIÓN INGENIEROS */}
          {engineers.length > 0 && (
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-3 px-4 py-2 bg-card border-l-4 border-primary rounded-r-xl shadow-md">
                  <Headphones className="w-4 h-4 text-primary" />
                  <h2 className="text-[12px] font-black uppercase tracking-[0.25em] text-foreground">Ingeniería de Audio</h2>
                </div>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {engineers.map(musician => (
                  <MusicianCard 
                    key={musician.id} 
                    musician={musician} 
                    onViewDetails={() => setSelectedMusicianId(musician.id)} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN STAFF TÉCNICO */}
          {staffTech.length > 0 && (
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-3 px-4 py-2 bg-card border-l-4 border-primary rounded-r-xl shadow-md">
                  <Settings className="w-4 h-4 text-primary" />
                  <h2 className="text-[12px] font-black uppercase tracking-[0.25em] text-foreground">Staff Técnico y Apoyo</h2>
                </div>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {staffTech.map(musician => (
                  <MusicianCard 
                    key={musician.id} 
                    musician={musician} 
                    onViewDetails={() => setSelectedMusicianId(musician.id)} 
                  />
                ))}
              </div>
            </div>
          )}

          {searchMatched.length === 0 && (
            <div className="col-span-full p-8 text-center border border-dashed border-border/40 rounded-xl bg-card">
              <p className="text-muted-foreground">No se encontraron resultados.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="matriz" className="mt-0">
          <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
            <CoverageMatrix musicians={activeMatched} onViewDetails={(m: any) => setSelectedMusicianId(m.id)} />
          </div>
        </TabsContent>

        <TabsContent value="inactivos" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {inactiveMatched.map(musician => (
              <MusicianCard 
                key={musician.id} 
                musician={musician} 
                onViewDetails={() => setSelectedMusicianId(musician.id)} 
              />
            ))}
          </div>
          {inactiveMatched.length === 0 && (
            <div className="p-8 text-center border border-dashed border-border/40 rounded-xl bg-card mt-6">
              <p className="text-muted-foreground">No hay personal inactivo.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Sheet for details */}
      {selectedMusician && (
        <MusicianDetailsSheet 
          key={selectedMusician.id}
          musician={selectedMusician} 
          open={!!selectedMusicianId} 
          onOpenChange={(isOpen) => !isOpen && setSelectedMusicianId(null)} 
        />
      )}
    </div>
  )
}
