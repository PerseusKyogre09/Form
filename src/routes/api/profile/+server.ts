import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

// GET profile for the current user
export const GET: RequestHandler = async ({ locals }) => {
    const user = locals.user;
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await db.query.user.findFirst({
        where: eq(userTable.id, user.id)
    });

    if (!profile) return json({ error: 'Profile not found' }, { status: 404 });

    return json({ profile });
};

// PUT (update) profile for the current user
export const PUT: RequestHandler = async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const updates = await request.json();

        await db.update(userTable)
            .set({
                username: updates.username,
                display_name: updates.display_name,
                name: updates.display_name || user.name,
                bio: updates.bio,
                location: updates.location,
                website: updates.website,
                image: updates.avatar_url,
                twitter_url: updates.twitter_url,
                linkedin_url: updates.linkedin_url,
                github_url: updates.github_url,
                theme_preference: updates.theme_preference,
                updatedAt: new Date(),
            })
            .where(eq(userTable.id, user.id));

        return json({ success: true });
    } catch (error: any) {
        console.error('Error updating profile:', error);
        if (error.code === '23505') {
            return json({ error: 'Username already taken' }, { status: 409 });
        }
        return json({ error: error.message }, { status: 500 });
    }
};
