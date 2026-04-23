import { Button } from "@/components/ui/button"

export default function RepertorioPage() {
  const categories = [
    {
      name: "Pop & Dance en Inglés",
      songs: [
        "Treasure - Bruno Mars",
        "Don't Stop Me Now - Queen",
        "Levitating - Dua Lipa",
        "Uptown Funk - Bruno Mars",
        "Rolling in the Deep - Adele",
        "Shape of You - Ed Sheeran",
        "Moves Like Jagger - Maroon 5"
      ]
    },
    {
      name: "Pop Latino y Urbano",
      songs: [
        "Danza Kuduro - Don Omar",
        "Tusa - Karol G",
        "Despacito - Luis Fonsi",
        "La Chona - Los Tucanes",
        "Pepas - Farruko",
        "Provenza - Karol G",
        "Dakiti - Bad Bunny"
      ]
    },
    {
      name: "Rock & Clásicos Pop",
      songs: [
        "Lamento Boliviano - Enanitos Verdes",
        "De Música Ligera - Soda Stereo",
        "Persiana Americana - Soda Stereo",
        "Mr. Brightside - The Killers",
        "Sweet Child O' Mine - Guns N' Roses",
        "Livin' on a Prayer - Bon Jovi"
      ]
    },
    {
      name: "Baladas & Cenas (Soft)",
      songs: [
        "Perfect - Ed Sheeran",
        "La Incondicional - Luis Miguel",
        "Yellow - Coldplay",
        "A Thousand Years - Christina Perri",
        "Hasta mi Final - Il Divo"
      ]
    }
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-black py-24 md:py-32 border-b border-white/10">
        <div className="container px-4 text-center">
          <h1 className="font-heading font-black text-4xl md:text-6xl text-white uppercase tracking-widest mb-6">
            Nuestro <span className="text-primary italic">Repertorio</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Más de 300 canciones seleccionadas para hacer vibrar cada momento de tu evento.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
              {categories.map((cat, i) => (
                <div key={i}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-1 bg-primary" />
                    <h2 className="text-2xl font-bold text-white font-heading tracking-wider uppercase">{cat.name}</h2>
                  </div>
                  <ul className="space-y-3">
                    {cat.songs.map((song, j) => (
                      <li key={j} className="text-gray-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                        {song}
                      </li>
                    ))}
                    <li className="text-muted-foreground italic text-sm mt-4">+ 50 canciones más en esta categoría</li>
                  </ul>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-20 p-10 rounded-2xl border border-white/10 bg-card text-center max-w-4xl mx-auto relative overflow-hidden">
            <h3 className="text-2xl font-bold font-heading text-white mb-2">¿Tienes una canción especial en mente?</h3>
            <p className="text-muted-foreground mb-6">
              Si la canción de tu primer baile o tu momento especial no está en nuestro repertorio, ¡nosotros la ensayamos y la preparamos exclusivamente para ti!
            </p>
            <Button variant="default">Solicitar canción especial</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
