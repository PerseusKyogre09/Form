import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

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
        if (!user) {
            throw redirect(303, '/unauthorized');
        }

        // Check if user is admin in database
        const adminUser = await db
            .select()
            .from(userTable)
            .where(eq(userTable.email, user.email))
            .limit(1);

        if (!adminUser.length || !adminUser[0].is_admin) {
            throw redirect(303, '/unauthorized');
        }
    }

    return resolve(event);
}
