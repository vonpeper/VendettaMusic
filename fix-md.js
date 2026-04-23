const fs = require('fs')
const path = require('path')

const dir = 'src/content/noticias'
const files = fs.readdirSync(dir)

for (const file of files) {
  if (!file.endsWith('.md')) continue
  const content = fs.readFileSync(path.join(dir, file), 'utf-8')
  
  const titleMatch = content.match(/Title:\s*(.*?)\n/)
  const descMatch = content.match(/Description:\s*(.*?)\n/)
  
  const title = titleMatch ? titleMatch[1].replace(/"/g, '') : file
  const desc = descMatch ? descMatch[1].replace(/"/g, '') : ""
  
  let newBody = content.split('---')[1] || content
  
  // Limpiar basura de navegación del scraper
  newBody = newBody.replace(/\[Inicio\]\(https:\/\/www\.vendetta\.mx\)/g, '')
  newBody = newBody.replace(/\[Integrantes\].*?\n/g, '')
  newBody = newBody.replace(/\[Video muestra\].*?\n/g, '')
  newBody = newBody.replace(/\[Clientes\].*?\n/g, '')
  newBody = newBody.replace(/\[Contacto\].*?\n/g, '')
  newBody = newBody.replace(/\[Cotiza ahora\].*?\n/g, '')
  newBody = newBody.replace(/- \n/g, '')
  
  const newContent = `---
title: "${title}"
description: "${desc}"
date: "2025-01-01"
---
${newBody}
`
  fs.writeFileSync(path.join(dir, file), newContent)
}
console.log('Markdown files fixed')
