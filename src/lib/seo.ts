/**
 * SEO and Open Graph meta tag helpers
 */

export interface SEOMetaTags {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

export function generateMetaTags(seo: SEOMetaTags): Record<string, string> {
  const baseUrl = 'https://quill.kyogre-perseus09.workers.dev';
  
  return {
    'og:title': seo.title,
    'og:description': seo.description,
    'og:type': seo.type || 'website',
    'og:image': seo.image || `${baseUrl}/preview.jpg`,
    'og:url': seo.url || baseUrl,
    'twitter:title': seo.title,
    'twitter:description': seo.description,
    'twitter:image': seo.image || `${baseUrl}/preview.jpg`,
    'twitter:card': 'summary_large_image',
    'description': seo.description,
  };
}

/**
 * For use in +layout.svelte or +page.svelte
 * Example:
 * <svelte:head>
 *   {#each Object.entries(seoTags) as [key, value]}
 *     <meta property={key} content={value} />
 *   {/each}
 * </svelte:head>
 */
export function createSEOTags(title: string, description: string, image?: string, url?: string) {
  return generateMetaTags({
    title,
    description,
    image,
    url,
  });
}
