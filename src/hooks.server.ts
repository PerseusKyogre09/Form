import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    // Better Auth SvelteKit handler handles /api/auth/* routes
    if (event.url.pathname.startsWith('/api/auth')) {
        return svelteKitHandler({ event, resolve, auth });
    }

    // For other routes, we can pre-fetch the session to populate locals
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

    return resolve(event);
};
