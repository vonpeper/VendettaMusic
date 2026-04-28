"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MusicianCard } from "./MusicianCard"
import { CoverageMatrix } from "./CoverageMatrix"
import { MusicianDetailsSheet } from "./MusicianDetailsSheet"
import { AddMusicianForm } from "./MusicianActions"
import { Search } from "lucide-react"

export function BandaClientView({ initialMusicians }: { initialMusicians: any[] }) {
  const [search, setSearch] = useState("")
  const [selectedMusician, setSelectedMusician] = useState<any | null>(null)
  
  // Filter logic
  const filteredMusicians = initialMusicians.filter(m => 
    m.user.name.toLowerCase().includes(search.toLowerCase()) || 
    (m.instrument && m.instrument.toLowerCase().includes(search.toLowerCase()))
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
                placeholder="Buscar músico o instrumento..." 
                className="w-full pl-9 pr-4 py-2 bg-card border border-border/40 rounded-md text-sm text-foreground focus:outline-none focus:border-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <AddMusicianForm />
          </div>
        </div>

        <TabsContent value="tarjetas" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMusicians.map(musician => (
              <MusicianCard 
                key={musician.id} 
                musician={musician} 
                onViewDetails={() => setSelectedMusician(musician)} 
              />
            ))}
            {filteredMusicians.length === 0 && (
              <div className="col-span-full p-8 text-center border border-dashed border-border/40 rounded-xl bg-card">
                <p className="text-muted-foreground">No se encontraron músicos con esa búsqueda.</p>
              </div>
            )}
          </div>
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
