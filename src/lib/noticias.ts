import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const contentDir = path.join(process.cwd(), 'src/content/noticias')

export function getNoticias() {
  const files = fs.readdirSync(contentDir)
  const noticias = files.filter(f => f.endsWith('.md')).map(file => {
    const filePath = path.join(contentDir, file)
    const fileContents = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(fileContents)
    
    return {
      slug: file.replace('.md', ''),
      title: data.title,
      description: data.description,
      date: data.date,
      content
    }
  })
  
  return noticias
}

export function getNoticiaBySlug(slug: string) {
  try {
    const filePath = path.join(contentDir, `${slug}.md`)
    const fileContents = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(fileContents)
    
    return {
      slug,
      title: data.title,
      description: data.description,
      date: data.date,
      content
    }
  } catch(e) {
    return null
  }
}
