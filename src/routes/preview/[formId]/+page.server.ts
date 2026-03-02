import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request }) => {
    // Only allow this page to be loaded inside an iframe.
    // Sec-Fetch-Dest is set by the browser and cannot be spoofed via JS.
    const fetchDest = request.headers.get('sec-fetch-dest');

    if (fetchDest !== 'iframe') {
        throw redirect(302, '/');
    }

    return {};
};
