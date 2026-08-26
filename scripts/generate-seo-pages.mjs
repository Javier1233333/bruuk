import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const distRoot = resolve(projectRoot, 'dist');
const config = JSON.parse(await readFile(resolve(projectRoot, 'src/data/seo.json'), 'utf8'));
const template = await readFile(resolve(distRoot, 'index.html'), 'utf8');

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const absoluteUrl = (value) => new URL(value, `${config.siteUrl}/`).toString();

function replaceMeta(html, attribute, key, content) {
  const pattern = new RegExp(`<meta\\s+${attribute}=["']${key}["'][^>]*>`, 'i');
  const tag = `<meta ${attribute}="${key}" content="${escapeHtml(content)}">`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `  ${tag}\n</head>`);
}

function structuredData(entry, canonical, image) {
  if (entry.type === 'article') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: entry.title,
      description: entry.description,
      image: [image],
      mainEntityOfPage: canonical,
      articleSection: entry.section,
      author: entry.author
        ? { '@type': 'Person', name: entry.author }
        : { '@type': 'Organization', name: config.siteName },
      publisher: { '@type': 'Organization', name: config.siteName, url: config.siteUrl },
    };
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.siteName,
    url: canonical,
    description: entry.description,
  };
}

function render(entry, route) {
  const canonical = absoluteUrl(entry.canonical || route);
  const image = absoluteUrl(entry.image);
  let html = template.replace(/<html\s+lang=["'][^"']*["']>/i, '<html lang="es-MX">');
  html = html.replace(/<title>.*?<\/title>/is, `<title>${escapeHtml(entry.title)}</title>`);
  html = replaceMeta(html, 'name', 'description', entry.description);
  html = replaceMeta(html, 'name', 'robots', entry.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large');
  html = replaceMeta(html, 'property', 'og:type', entry.type);
  html = replaceMeta(html, 'property', 'og:title', entry.title);
  html = replaceMeta(html, 'property', 'og:description', entry.description);
  html = replaceMeta(html, 'property', 'og:url', canonical);
  html = replaceMeta(html, 'property', 'og:image', image);
  html = replaceMeta(html, 'property', 'og:image:alt', entry.imageAlt);
  html = replaceMeta(html, 'name', 'twitter:title', entry.title);
  html = replaceMeta(html, 'name', 'twitter:description', entry.description);
  html = replaceMeta(html, 'name', 'twitter:image', image);
  html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${escapeHtml(canonical)}">`);
  const json = JSON.stringify(structuredData(entry, canonical, image)).replaceAll('<', '\\u003c');
  html = html.replace(/<script\s+type=["']application\/ld\+json["']\s+id=["']seo-json-ld["']>.*?<\/script>/is, `<script type="application/ld+json" id="seo-json-ld">${json}</script>`);
  return html;
}

for (const [route, entry] of Object.entries(config.routes)) {
  const output = route === '/' ? resolve(distRoot, 'index.html') : resolve(distRoot, route.slice(1), 'index.html');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, render(entry, route), 'utf8');
}

const indexedRoutes = Object.entries(config.routes).filter(([, entry]) => !entry.noindex);
const sitemapEntry = (route, entry) => {
  const lines = [`    <loc>${absoluteUrl(entry.canonical || route)}</loc>`];
  if (entry.lastmod) lines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
  return `  <url>\n${lines.join('\n')}\n  </url>`;
};
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexedRoutes.map(([route, entry]) => sitemapEntry(route, entry)).join('\n')}
</urlset>
`;
await writeFile(resolve(distRoot, 'sitemap.xml'), sitemap, 'utf8');
await writeFile(resolve(distRoot, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`, 'utf8');

console.log(`Generated SEO HTML for ${Object.keys(config.routes).length} routes, sitemap.xml and robots.txt.`);
