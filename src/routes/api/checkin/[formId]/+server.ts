import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { forms, form_responses } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals, params }) => {
    const user = locals.user;
    if (!user) {
        return json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    try {
        const { submissionId } = await request.json();
        const formId = params.formId;

        if (!submissionId || !formId) {
            return json({ error: 'Missing submissionId or formId' }, { status: 400 });
        }

        // Verify the logged-in user owns this form
        const formData = await db.query.forms.findFirst({
            where: eq(forms.id, formId),
            columns: {
                id: true,
                user_id: true,
                enable_checkin: true,
                checkin_name_field_id: true
            }
        });

        if (!formData) {
            return json({ error: 'Form not found' }, { status: 404 });
        }

        if (formData.user_id !== user.id) {
            return json({ error: 'You do not own this form' }, { status: 403 });
        }

        if (!formData.enable_checkin) {
            return json({ error: 'Check-in is not enabled for this form' }, { status: 400 });
        }

        // Check if the submission exists and belongs to this form
        const submission = await db.query.form_responses.findFirst({
            where: and(
                eq(form_responses.id, submissionId),
                eq(form_responses.form_id, formId)
            )
        });

        if (!submission) {
            return json({ error: 'Submission not found for this form' }, { status: 404 });
        }

        if (submission.checked_in) {
            // Already checked in - retrieve the name for display
            let attendeeName = 'Unknown';
            const answers = submission.answers as Record<string, any>;
            if (formData.checkin_name_field_id && answers) {
                attendeeName = answers[formData.checkin_name_field_id] || 'Unknown';
            }
            return json({
                success: false,
                alreadyCheckedIn: true,
                attendeeName,
                message: 'This participant has already been checked in.'
            });
        }

        // Mark as checked in
        await db.update(form_responses)
            .set({ checked_in: true })
            .where(eq(form_responses.id, submissionId));

        // Extract attendee name
        let attendeeName = 'Unknown';
        const answers = submission.answers as Record<string, any>;
        if (formData.checkin_name_field_id && answers) {
            attendeeName = answers[formData.checkin_name_field_id] || 'Unknown';
        }

        return json({
            success: true,
            attendeeName,
            message: `${attendeeName} has been checked in!`
        });

    } catch (error: any) {
        console.error('Check-in error:', error);
        return json({ error: 'Internal server error', message: error.message }, { status: 500 });
    }
};
