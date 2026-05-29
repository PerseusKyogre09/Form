import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user as userTable, account as accountTable } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Helper to check if the user is authenticated and is an admin in the database
async function verifyAdmin(locals: any): Promise<boolean> {
    if (!locals.user) return false;
    const adminUser = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, locals.user.email))
        .limit(1);
    return adminUser.length > 0 && !!adminUser[0].is_admin;
}

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET({ locals }) {
    // Check if user is admin
    if (!(await verifyAdmin(locals))) {
        return json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        // Fetch all users
        const users = await db.query.user.findMany();
        return json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function POST({ request, locals }) {
    // Check if user is admin
    if (!(await verifyAdmin(locals))) {
        return json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { name, email, password, username } = await request.json();

        if (!name || !email || !password) {
            return json({ error: 'Missing required fields: name, email, password' }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await db
            .select()
            .from(userTable)
            .where(eq(userTable.email, email))
            .limit(1);

        if (existingUser.length > 0) {
            return json({ error: 'User already exists' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a consistent user ID
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const accountId = `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create new user
        await db.insert(userTable).values({
            id: userId,
            name,
            email,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            username: username || email.split('@')[0]
        });

        // Create account with password
        await db.insert(accountTable).values({
            id: accountId,
            accountId: email,
            providerId: 'credential',
            userId: userId,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return json({ success: true, message: 'User created successfully' });
    } catch (error) {
        console.error('Error creating user:', error);
        return json({ error: 'Failed to create user' }, { status: 500 });
    }
}
