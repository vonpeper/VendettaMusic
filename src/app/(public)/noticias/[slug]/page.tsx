import { getNoticiaBySlug, getNoticias } from "@/lib/noticias"
import { notFound } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"

export function generateStaticParams() {
  const posts = getNoticias()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export default async function NoticiaPage(props: { params: { slug: string } }) {
  const params = await props.params;
  const post = getNoticiaBySlug(params.slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-white/10 bg-black pt-32 pb-16">
        <div className="container px-4 max-w-3xl mx-auto">
          <Link href="/noticias" className="text-primary hover:underline text-sm font-bold mb-4 inline-block">
            ← Volver a Noticias
          </Link>
          <div className="text-muted-foreground text-sm font-bold mb-4">{post.date}</div>
          <h1 className="font-heading font-black text-3xl md:text-5xl text-white tracking-tight leading-tight mb-6">
            {post.title}
          </h1>
          <p className="text-xl text-primary/80 italic border-l-4 border-primary pl-4">
            {post.description}
          </p>
        </div>
      </div>

      <article className="container px-4 max-w-3xl mx-auto pt-16 pb-24 text-lg text-muted-foreground leading-relaxed">
        <ReactMarkdown
          components={{
            h1: ({node, ...props}) => <h1 className="text-4xl font-heading font-black text-white mt-12 mb-6" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-3xl font-heading font-bold text-white mt-10 mb-4" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-2xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2" {...props} />,
            h4: ({node, ...props}) => <h4 className="text-xl font-bold text-white mt-6 mb-3" {...props} />,
            h5: ({node, ...props}) => <h5 className="text-lg font-bold text-white mt-6 mb-2" {...props} />,
            h6: ({node, ...props}) => <h6 className="text-base font-bold text-muted-foreground uppercase tracking-widest mt-6 mb-2" {...props} />,
            p: ({node, ...props}) => <p className="mb-6 opacity-90" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-6 opacity-90 space-y-2 marker:text-primary" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-6 opacity-90 space-y-2 marker:text-primary" {...props} />,
            a: ({node, ...props}) => <a className="text-primary hover:text-primary/80 underline underline-offset-4 decoration-primary/50" {...props} />,
            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary pl-6 italic text-gray-400 bg-white/5 py-4 pr-4 rounded-r-lg my-8" {...props} />,
            strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
          }}
        >
          {post.content}
        </ReactMarkdown>
      </article>
    </div>
  )
}
