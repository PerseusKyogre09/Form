import { redirect } from '@sveltejs/kit';

export async function GET({ params, url }) {
  const username = params.username;
  const slug = params.slug;
  const origin = url.origin;
  const hostname = url.hostname;

  const version = url.searchParams.get('v') || '1';

  // On localhost/127.0.0.1, redirect to the SVG endpoint directly for instant local previews
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
    throw redirect(302, `/form/${username}/${slug}/og.svg?v=${version}`);
  }

  // In production, construct the absolute SVG endpoint URL with the version parameter
  const svgUrl = `${origin}/form/${username}/${slug}/og.svg?v=${version}`;

  // Redirect permanently (301) to images.weserv.nl (runs on Cloudflare's own network)
  // This converts the SVG to a crisp PNG and caches it globally on their edge for 31 days.
  // This takes absolute zero CPU/memory load on your own Cloudflare Worker!
  const pngUrl = `https://images.weserv.nl/?url=${encodeURIComponent(svgUrl)}&output=png`;

  throw redirect(301, pngUrl);
}
