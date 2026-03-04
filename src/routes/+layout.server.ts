import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals, url }) => {
    const currentPath = url.pathname;
    const isPublicRoute =
        currentPath === "/" ||
        currentPath === "/login" ||
        currentPath === "/signup" ||
        currentPath === "/unauthorized" ||
        currentPath === "/certificate-generator" ||
        currentPath.startsWith("/form/") ||
        currentPath.startsWith("/preview/");

    if (!locals.session && !isPublicRoute) {
        throw redirect(302, '/login');
    }

    if (locals.session && (currentPath === "/login" || currentPath === "/signup")) {
        throw redirect(302, '/dashboard');
    }

    let themePreferenceStr = "light";

    if (locals.user) {
        try {
            const profile = await db.query.user.findFirst({
                where: eq(userTable.id, locals.user.id),
                columns: { theme_preference: true }
            });
            if (profile?.theme_preference) {
                themePreferenceStr = profile.theme_preference;
            }
        } catch (e) {
            // Profil not exist
        }
    }

    return {
        user: locals.user,
        session: locals.session,
        themePreference: themePreferenceStr
    };
};
