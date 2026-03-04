import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { forms, form_responses } from '$lib/server/schema';
import { eq, and, count } from 'drizzle-orm';

export async function load({ params, locals }) {
    const user = locals.user;
    const formId = params.formId;

    // Check if user is logged in
    if (!user) {
        throw redirect(303, '/login');
    }

    // Verify the user owns this form
    const formData = await db.query.forms.findFirst({
        where: eq(forms.id, formId),
        columns: {
            id: true,
            title: true,
            user_id: true,
            enable_checkin: true,
            checkin_name_field_id: true
        }
    });

    if (!formData) {
        throw error(404, 'Form not found');
    }

    if (formData.user_id !== user.id) {
        throw error(403, 'You do not have access to this form');
    }

    // Get check-in stats
    const [totalResult] = await db
        .select({ value: count() })
        .from(form_responses)
        .where(eq(form_responses.form_id, formId));

    const [checkedInResult] = await db
        .select({ value: count() })
        .from(form_responses)
        .where(
            and(
                eq(form_responses.form_id, formId),
                eq(form_responses.checked_in, true)
            )
        );

    return {
        form: {
            id: formData.id,
            title: formData.title,
            enableCheckin: formData.enable_checkin,
            checkinNameFieldId: formData.checkin_name_field_id
        },
        stats: {
            totalResponses: totalResult.value || 0,
            checkedIn: checkedInResult.value || 0
        }
    };
}
