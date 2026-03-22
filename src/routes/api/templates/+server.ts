import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { FORM_TEMPLATES } from '$lib/templates';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const category = url.searchParams.get('category');
    
    let templates = FORM_TEMPLATES;
    
    // Filter by category if provided
    if (category && category !== 'all') {
      templates = templates.filter(t => t.category === category);
    }

    return json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
};
