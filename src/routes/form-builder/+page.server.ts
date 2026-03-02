import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    // Generate a random UUID for the new form
    const formId = crypto.randomUUID();

    // Redirect immediately to the ID-specific builder route
    throw redirect(302, `/form-builder/${formId}`);
};
