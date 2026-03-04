import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { forms, form_responses } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
    const user = locals.user;
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

    const formId = url.searchParams.get('formId');
    const filter = url.searchParams.get('filter'); // 'all' or 'checked_in'

    if (!formId) return json({ error: 'Form ID required' }, { status: 400 });

    try {
        // Get the form's name field
        const form = await db.query.forms.findFirst({
            where: and(
                eq(forms.id, formId),
                eq(forms.user_id, user.id) // Verify ownership
            ),
            columns: { checkin_name_field_id: true }
        });

        if (!form) return json({ error: 'Form not found or unauthorized' }, { status: 404 });

        // Build query for responses
        const conditions = [eq(form_responses.form_id, formId)];
        if (filter === 'checked_in') {
            conditions.push(eq(form_responses.checked_in, true));
        }

        const responsesData = await db.query.form_responses.findMany({
            where: and(...conditions),
            columns: { answers: true }
        });

        const nameFieldId = form.checkin_name_field_id;

        const names = responsesData.map(r => {
            const answers = r.answers as Record<string, any>;

            // Try configured name field
            if (nameFieldId && answers && answers[nameFieldId]) {
                return String(answers[nameFieldId]);
            }

            // Fallback: try finding any string value in answers
            if (answers && typeof answers === 'object') {
                const ObjectValues = Object.values(answers);
                const firstString = ObjectValues.find(v => typeof v === 'string' && v.trim().length > 0);
                return firstString ? String(firstString) : '';
            }
            return '';
        }).filter(n => n.trim() !== '');

        return json({ names });

    } catch (err: any) {
        console.error('Error fetching attendees:', err);
        return json({ error: err.message }, { status: 500 });
    }
};
