#! /usr/bin/env node

const path = require('path')
const fs = require('fs')

const [srcDirOption, siteRoot, extensionsOption, mode] = process.argv.slice(2)

const usage = `USAGE:
  static-sitemap SRCDIR SITEROOT [EXTENSIONS] [MODE]

    SRCDIR       The source directory to be walked for page paths
    SITEROOT     The website root, ending with a forward slash e.g. https://lins.dev/
    EXTENSIONS   A comma-separated list of file extensions to match as pages (default html,htm)
    MODE         If -r, removes file extensions from sitemap (useful for static site generators)
`

if (!process.argv.slice(2).length) {
  console.log(usage)
  process.exit(0)
}

if (!srcDirOption || !siteRoot) {
  console.error(usage)
  process.exit(1)
}

const srcDir = path.join(__dirname, srcDirOption)
const diskPages = fs.readdirSync(srcDir)
const extensions = extensionsOption ? extensionsOption.split(',') : ['html', 'htm']

const normDate = dateVal => {
  const dt = new Date(dateVal)
  const yyyy = dt.getFullYear()
  const mm = (dt.getMonth() + 1).toString().padStart(2, '0')
  const dd = dt.getDate().toString().padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const extensionsRegex = new RegExp(`\.(${extensions.join('|')})$`)

let xml = `
  <?xml version='1.0' encoding='UTF-8'?>
  <urlset xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'>
`

for (const filename of diskPages) {
  const fullPath = path.join(srcDir, filename)
  const modDate = normDate(fs.statSync(fullPath).mtime)

  let pageUri = filename.replace(path.join(__dirname, '..', 'pages'), '')
  if (!pageUri.match(extensionsRegex)) continue

  if (mode === '-r') {
    pageUri = pageUri.replace(extensionsRegex, '')
  }
  pageUri = `${siteRoot}${pageUri}`

  if (pageUri.match(/.*\/index$/)) {
    pageUri = pageUri.replace(/(.*)index$/, '$1')
  }

  xml += `<url>
    <loc>${pageUri}</loc>
    <lastmod>${modDate}</lastmod>
    <changefreq>always</changefreq>
    <priority>0.5</priority>
  </url>`
}

xml += '</urlset>'

console.log(xml.replace(/(^|>)\s*([^\s])/gm, '$1$2'))
