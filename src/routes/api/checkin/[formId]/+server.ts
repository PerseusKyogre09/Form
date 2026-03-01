import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$lib/supabaseServer';

export const POST: RequestHandler = async ({ request, cookies, params }) => {
    const supabase = createSupabaseServerClient(cookies);

    try {
        // Verify the organizer is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
        }

        const { submissionId } = await request.json();
        const formId = params.formId;

        if (!submissionId || !formId) {
            return json({ error: 'Missing submissionId or formId' }, { status: 400 });
        }

        // Verify the logged-in user owns this form
        const { data: formData, error: formError } = await supabase
            .from('forms')
            .select('id, user_id, enable_checkin, checkin_name_field_id')
            .eq('id', formId)
            .single();

        if (formError || !formData) {
            return json({ error: 'Form not found' }, { status: 404 });
        }

        if (formData.user_id !== session.user.id) {
            return json({ error: 'You do not own this form' }, { status: 403 });
        }

        if (!formData.enable_checkin) {
            return json({ error: 'Check-in is not enabled for this form' }, { status: 400 });
        }

        // Check if the submission exists and belongs to this form
        const { data: submission, error: subError } = await supabase
            .from('form_responses')
            .select('id, answers, checked_in')
            .eq('id', submissionId)
            .eq('form_id', formId)
            .single();

        if (subError || !submission) {
            return json({ error: 'Submission not found for this form' }, { status: 404 });
        }

        if (submission.checked_in) {
            // Already checked in - retrieve the name for display
            let attendeeName = 'Unknown';
            if (formData.checkin_name_field_id && submission.answers) {
                attendeeName = submission.answers[formData.checkin_name_field_id] || 'Unknown';
            }
            return json({
                success: false,
                alreadyCheckedIn: true,
                attendeeName,
                message: 'This participant has already been checked in.'
            });
        }

        // Mark as checked in
        const { error: updateError } = await supabase
            .from('form_responses')
            .update({ checked_in: true })
            .eq('id', submissionId);

        if (updateError) {
            console.error('Error updating check-in status:', updateError);
            return json({ error: 'Failed to update check-in status' }, { status: 500 });
        }

        // Extract attendee name
        let attendeeName = 'Unknown';
        if (formData.checkin_name_field_id && submission.answers) {
            attendeeName = submission.answers[formData.checkin_name_field_id] || 'Unknown';
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
