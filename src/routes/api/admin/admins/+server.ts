import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user as userTable, forms, form_collaborators, account, session } from '$lib/server/schema';
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

            // Get the user ID first
            const userRecord = await db
                .select()
                .from(userTable)
                .where(eq(userTable.email, email))
                .limit(1);

            if (userRecord.length === 0) {
                return json({ error: 'User not found' }, { status: 404 });
            }

            const userId = userRecord[0].id;

            try {
                // Delete related data in the correct order
                // 1. Delete sessions
                await db.delete(session).where(eq(session.userId, userId));
            } catch (err) {
                console.error('Error deleting sessions:', err);
            }

            try {
                // 2. Delete form collaborators
                await db.delete(form_collaborators).where(eq(form_collaborators.user_id, userId));
            } catch (err) {
                console.error('Error deleting form collaborators:', err);
            }

            try {
                // 3. Delete user accounts
                await db.delete(account).where(eq(account.userId, userId));
            } catch (err) {
                console.error('Error deleting accounts:', err);
            }

            try {
                // 4. Delete user forms (cascades will handle form_responses)
                await db.delete(forms).where(eq(forms.user_id, userId));
            } catch (err) {
                console.error('Error deleting forms:', err);
            }

            try {
                // 5. Finally delete the user
                await db.delete(userTable).where(eq(userTable.email, email));
            } catch (err) {
                console.error('Error deleting user:', err);
                throw err;
            }

            return json({ success: true, message: `User ${email} deleted` });
        }

        return json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error managing admins:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return json({ error: `Failed to manage admins: ${errorMessage}` }, { status: 500 });
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
