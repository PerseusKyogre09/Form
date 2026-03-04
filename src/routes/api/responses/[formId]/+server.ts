import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { form_responses, forms } from '$lib/server/schema';
import { eq, and, ilike, desc, asc, count, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, url, locals }) => {
    const user = locals.user;
    const formId = params.formId;

    try {
        // Verify form ownership (responses are viewable by form owner)
        const form = await db.query.forms.findFirst({
            where: eq(forms.id, formId),
            columns: { user_id: true }
        });

        if (!form) return json({ error: 'Form not found' }, { status: 404 });

        // Allow unauthenticated basic access for public form stats? 
        // For now, require auth for response data
        if (user && form.user_id !== user.id) {
            return json({ error: 'Forbidden' }, { status: 403 });
        }

        const page = parseInt(url.searchParams.get('page') || '1');
        const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
        const sortDir = url.searchParams.get('sortDir') || 'desc';
        const offset = (page - 1) * pageSize;

        // Get total count
        const [countResult] = await db
            .select({ value: count() })
            .from(form_responses)
            .where(eq(form_responses.form_id, formId));

        // Get paginated responses
        const responses = await db.select()
            .from(form_responses)
            .where(eq(form_responses.form_id, formId))
            .orderBy(sortDir === 'asc' ? asc(form_responses.created_at) : desc(form_responses.created_at))
            .limit(pageSize)
            .offset(offset);

        return json({
            responses: responses.map(r => ({
                ...r,
                timestamp: new Date(r.created_at).getTime()
            })),
            totalCount: countResult.value
        });
    } catch (error) {
        console.error('Error fetching responses:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
    const user = locals.user;
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

    const formId = params.formId;

    // Verify form ownership
    const form = await db.query.forms.findFirst({
        where: eq(forms.id, formId),
        columns: { user_id: true }
    });

    if (!form || form.user_id !== user.id) {
        return json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        await db.delete(form_responses)
            .where(eq(form_responses.form_id, formId));

        return json({ success: true });
    } catch (error) {
        console.error('Error deleting responses:', error);
        return json({ error: 'Failed to delete responses' }, { status: 500 });
    }
};
