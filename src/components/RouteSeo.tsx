import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import seoConfig from '../data/seo.json';

type SeoEntry = typeof seoConfig.default & {
  section?: string;
  author?: string;
  noindex?: boolean;
};

const routeEntries = seoConfig.routes as Record<string, SeoEntry>;

function absoluteUrl(value: string) {
  return new URL(value, `${seoConfig.siteUrl}/`).toString();
}

function setMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function structuredData(entry: SeoEntry, canonical: string, image: string) {
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
        : { '@type': 'Organization', name: seoConfig.siteName },
      publisher: { '@type': 'Organization', name: seoConfig.siteName, url: seoConfig.siteUrl },
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: seoConfig.siteName,
    url: canonical,
    description: entry.description,
  };
}

export function RouteSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const normalizedPath = pathname !== '/' ? pathname.replace(/\/$/, '') : '/';
    const entry = routeEntries[normalizedPath] ?? seoConfig.default;
    const canonical = absoluteUrl(normalizedPath);
    const image = absoluteUrl(entry.image);
    const robots = entry.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large';

    document.documentElement.lang = 'es-MX';
    document.title = entry.title;
    setMeta('meta[name="description"]', 'name', 'description', entry.description);
    setMeta('meta[name="robots"]', 'name', 'robots', robots);
    setMeta('meta[property="og:type"]', 'property', 'og:type', entry.type);
    setMeta('meta[property="og:title"]', 'property', 'og:title', entry.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', entry.description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    setMeta('meta[property="og:image"]', 'property', 'og:image', image);
    setMeta('meta[property="og:image:alt"]', 'property', 'og:image:alt', entry.imageAlt);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', entry.title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', entry.description);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image);

    let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    let jsonLd = document.head.querySelector<HTMLScriptElement>('#seo-json-ld');
    if (!jsonLd) {
      jsonLd = document.createElement('script');
      jsonLd.id = 'seo-json-ld';
      jsonLd.type = 'application/ld+json';
      document.head.appendChild(jsonLd);
    }
    jsonLd.textContent = JSON.stringify(structuredData(entry, canonical, image));
  }, [pathname]);

  return null;
}
