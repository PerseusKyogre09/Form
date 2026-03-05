import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

const ADMIN_EMAILS = ['kyogre.perseus09@gmail.com'];
const MAX_ADMINS = 5; // Store in a separate table or config

// In-memory store for admin emails (in production, use a database)
let adminEmails = new Set(['kyogre.perseus09@gmail.com']);

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function POST({ request, locals }) {
    // Check if user is admin
    if (!locals.user || !ADMIN_EMAILS.includes(locals.user.email)) {
        return json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { action, userId, email } = await request.json();

        if (!action || !email) {
            return json({ error: 'Missing required fields: action, email' }, { status: 400 });
        }

        if (action === 'add-admin') {
            if (adminEmails.size >= MAX_ADMINS) {
                return json({ error: `Maximum ${MAX_ADMINS} admins allowed` }, { status: 400 });
            }
            adminEmails.add(email);
            return json({ success: true, message: `${email} is now an admin` });
        }

        if (action === 'remove-admin') {
            // Cannot remove the original admin
            if (email === 'kyogre.perseus09@gmail.com') {
                return json({ error: 'Cannot remove the original admin' }, { status: 400 });
            }
            adminEmails.delete(email);
            return json({ success: true, message: `${email} is no longer an admin` });
        }

        if (action === 'delete-user') {
            // Cannot delete admin users
            if (adminEmails.has(email)) {
                return json({ error: 'Cannot delete admin users. Remove admin privilege first.' }, { status: 400 });
            }

            const result = await db.delete(userTable).where(eq(userTable.email, email));
            return json({ success: true, message: `User ${email} deleted` });
        }

        return json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error managing admins:', error);
        return json({ error: 'Failed to manage admins' }, { status: 500 });
    }
}

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET({ locals }) {
    // Check if user is admin
    if (!locals.user || !ADMIN_EMAILS.includes(locals.user.email)) {
        return json({ error: 'Unauthorized' }, { status: 403 });
    }

    return json({ admins: Array.from(adminEmails) });
}
