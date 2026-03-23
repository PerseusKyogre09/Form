import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user as userTable, forms, form_collaborators, account, session } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

const ORIGINAL_ADMIN_EMAIL = 'kyogre.perseus09@gmail.com';
const MAX_ADMINS = 5;

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function POST({ request, locals }) {
    // Check if user is admin
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if user is actually an admin in the database
    const adminUser = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, locals.user.email))
        .limit(1);

    if (!adminUser.length || !adminUser[0].is_admin) {
        return json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { action, email } = await request.json();

        if (!action || !email) {
            return json({ error: 'Missing required fields: action, email' }, { status: 400 });
        }

        // Find the user to modify
        const targetUser = await db
            .select()
            .from(userTable)
            .where(eq(userTable.email, email))
            .limit(1);

        if (!targetUser.length) {
            return json({ error: 'User not found' }, { status: 404 });
        }

        const userId = targetUser[0].id;

        if (action === 'add-admin') {
            // Check max admins limit
            const adminCount = await db
                .select()
                .from(userTable)
                .where(eq(userTable.is_admin, true));

            if (adminCount.length >= MAX_ADMINS) {
                return json({ error: `Maximum ${MAX_ADMINS} admins allowed` }, { status: 400 });
            }

            // Update user to admin
            await db
                .update(userTable)
                .set({ is_admin: true })
                .where(eq(userTable.id, userId));

            return json({ success: true, message: `${email} is now an admin` });
        }

        if (action === 'remove-admin') {
            // Cannot remove the original admin
            if (email === ORIGINAL_ADMIN_EMAIL) {
                return json({ error: 'Cannot remove the original admin' }, { status: 400 });
            }

            // Update user to non-admin
            await db
                .update(userTable)
                .set({ is_admin: false })
                .where(eq(userTable.id, userId));

            return json({ success: true, message: `${email} is no longer an admin` });
        }

        if (action === 'delete-user') {
            // Cannot delete the original admin
            if (email === ORIGINAL_ADMIN_EMAIL) {
                return json({ error: 'Cannot delete the original admin user' }, { status: 400 });
            }

            // Cannot delete admin users
            if (targetUser[0].is_admin) {
                return json({ error: 'Cannot delete admin users. Remove admin privilege first.' }, { status: 400 });
            }

            try {
                // Delete related data in the correct order
                await db.delete(session).where(eq(session.userId, userId));
            } catch (err) {
                console.error('Error deleting sessions:', err);
            }

            try {
                await db.delete(form_collaborators).where(eq(form_collaborators.user_id, userId));
            } catch (err) {
                console.error('Error deleting form collaborators:', err);
            }

            try {
                await db.delete(account).where(eq(account.userId, userId));
            } catch (err) {
                console.error('Error deleting accounts:', err);
            }

            try {
                await db.delete(forms).where(eq(forms.user_id, userId));
            } catch (err) {
                console.error('Error deleting forms:', err);
            }

            try {
                await db.delete(userTable).where(eq(userTable.id, userId));
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
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 403 });
    }

    const adminUser = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, locals.user.email))
        .limit(1);

    if (!adminUser.length || !adminUser[0].is_admin) {
        return json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all admins from database
    const admins = await db
        .select({ email: userTable.email, name: userTable.name })
        .from(userTable)
        .where(eq(userTable.is_admin, true));

    return json({ admins: admins.map(a => a.email) });
}
