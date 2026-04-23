import Link from "next/link"
import { getNoticias } from "@/lib/noticias"
import { Card, CardContent } from "@/components/ui/card"

export default function NoticiasPage() {
  const noticias = getNoticias()

  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-black py-24 md:py-32 border-b border-white/10">
        <div className="container px-4 text-center">
          <h1 className="font-heading font-black text-4xl md:text-6xl text-white uppercase tracking-widest mb-6">
            Últimas <span className="text-primary italic">Noticias</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Entérate de nuestros últimos shows, reseñas y lo que está pasando en Vendetta.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="container px-4 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {noticias.map((post) => (
              <Link key={post.slug} href={`/noticias/${post.slug}`}>
                <Card className="h-full bg-card hover:border-primary/50 transition-colors border-white/10 cursor-pointer overflow-hidden group">
                  <div className="aspect-video bg-white/5 border-b border-white/10 flex items-center justify-center font-heading text-primary/30 text-4xl">
                    VENDETTA
                  </div>
                  <CardContent className="p-6">
                    <div className="text-primary text-sm font-bold mb-2">{post.date}</div>
                    <h2 className="text-xl font-bold font-heading text-white mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground line-clamp-3">
                      {post.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
