import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/schema';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
    // Authorization is already checked in hooks.server.ts
    // Fetch all users for display
    const users = await db.query.user.findMany();
    
    return {
        user: locals.user,
        users
    };
}