import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    // Better Auth SvelteKit handler handles /api/auth/* routes
    if (event.url.pathname.startsWith('/api/auth')) {
        return svelteKitHandler({ event, resolve, auth });
    }

    // First, fetch the session and populate locals
    const session = await auth.api.getSession({
        headers: event.request.headers
    });

    if (session) {
        event.locals.user = session.user;
        event.locals.session = session.session;
    } else {
        event.locals.user = null;
        event.locals.session = null;
    }

    // Now check admin access after session is populated
    if (event.url.pathname.startsWith('/admin')) {
        const user = event.locals.user;
        if (!user || !['kyogre.perseus09@gmail.com'].includes(user.email)) {
            throw redirect(303, '/unauthorized');
        }
    }

    return resolve(event);
}
