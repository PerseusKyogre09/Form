import { createSupabaseServerClient } from '$lib/supabaseServer';
import { error, redirect } from '@sveltejs/kit';

export async function load({ params, cookies }) {
    const supabase = createSupabaseServerClient(cookies);
    const formId = params.formId;

    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        throw redirect(303, '/login');
    }

    // Verify the user owns this form
    const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('id, title, user_id, enable_checkin, checkin_name_field_id')
        .eq('id', formId)
        .single();

    if (formError || !formData) {
        throw error(404, 'Form not found');
    }

    if (formData.user_id !== session.user.id) {
        throw error(403, 'You do not have access to this form');
    }

    // Get check-in stats
    const { count: totalResponses } = await supabase
        .from('form_responses')
        .select('id', { count: 'exact', head: true })
        .eq('form_id', formId);

    const { count: checkedInCount } = await supabase
        .from('form_responses')
        .select('id', { count: 'exact', head: true })
        .eq('form_id', formId)
        .eq('checked_in', true);

    return {
        form: {
            id: formData.id,
            title: formData.title,
            enableCheckin: formData.enable_checkin,
            checkinNameFieldId: formData.checkin_name_field_id
        },
        stats: {
            totalResponses: totalResponses || 0,
            checkedIn: checkedInCount || 0
        }
    };
}
