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
  const [selectedMusician, setSelectedMusician] = useState<any | null>(null)
  
  const filteredMusicians = initialMusicians.filter(m => 
    m.user.name.toLowerCase().includes(search.toLowerCase()) || 
    (m.instrument && m.instrument.toLowerCase().includes(search.toLowerCase()))
  )

  const musiciansOnly = filteredMusicians.filter(m => 
    !["Ingeniero de Audio", "Técnico", "Staff", "Proveedor"].includes(m.instrument || "")
  )
  
  const engineers = filteredMusicians.filter(m => 
    m.instrument === "Ingeniero de Audio"
  )

  const staffTech = filteredMusicians.filter(m => 
    ["Técnico", "Staff", "Proveedor"].includes(m.instrument || "")
  )

  return (
    <div>
      <Tabs defaultValue="tarjetas" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <TabsList className="bg-card border border-border/40">
            <TabsTrigger value="tarjetas">Vista Tarjetas</TabsTrigger>
            <TabsTrigger value="matriz">Matriz de Cobertura</TabsTrigger>
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
            <div className="flex items-center gap-3 px-4 py-2 bg-[#111111] border-l-4 border-[#E91E63] rounded-r-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                <Mic className="w-4 h-4 text-[#E91E63]" />
                <h2 className="text-[12px] font-black uppercase tracking-[0.25em] text-white">Titulares y Músicos</h2>
              </div>
              <div className="h-px flex-1 bg-border/40" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {musiciansOnly.map(musician => (
                <MusicianCard 
                  key={musician.id} 
                  musician={musician} 
                  onViewDetails={() => setSelectedMusician(musician)} 
                />
              ))}
            </div>
          </div>

          {/* SECCIÓN INGENIEROS */}
          {engineers.length > 0 && (
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-3 px-4 py-2 bg-[#111111] border-l-4 border-[#E91E63] rounded-r-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                  <Headphones className="w-4 h-4 text-[#E91E63]" />
                  <h2 className="text-[12px] font-black uppercase tracking-[0.25em] text-white">Ingeniería de Audio</h2>
                </div>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {engineers.map(musician => (
                  <MusicianCard 
                    key={musician.id} 
                    musician={musician} 
                    onViewDetails={() => setSelectedMusician(musician)} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN STAFF TÉCNICO */}
          {staffTech.length > 0 && (
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-3 px-4 py-2 bg-[#111111] border-l-4 border-[#E91E63] rounded-r-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                  <Settings className="w-4 h-4 text-[#E91E63]" />
                  <h2 className="text-[12px] font-black uppercase tracking-[0.25em] text-white">Staff Técnico y Apoyo</h2>
                </div>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {staffTech.map(musician => (
                  <MusicianCard 
                    key={musician.id} 
                    musician={musician} 
                    onViewDetails={() => setSelectedMusician(musician)} 
                  />
                ))}
              </div>
            </div>
          )}

          {filteredMusicians.length === 0 && (
            <div className="col-span-full p-8 text-center border border-dashed border-border/40 rounded-xl bg-card">
              <p className="text-muted-foreground">No se encontraron resultados.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="matriz" className="mt-0">
          <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
            <CoverageMatrix musicians={filteredMusicians} onViewDetails={setSelectedMusician} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Sheet for details */}
      <MusicianDetailsSheet 
        musician={selectedMusician} 
        open={!!selectedMusician} 
        onOpenChange={(isOpen) => !isOpen && setSelectedMusician(null)} 
      />
    </div>
  )
}
