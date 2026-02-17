import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$lib/supabaseServer';

export const GET: RequestHandler = async ({ url, params, cookies }) => {
  const supabase = createSupabaseServerClient(cookies);
  const formId = params.formId;

  try {
    // Get all collaborators for the form (RLS will restrict what user sees)
    const { data: collaborators, error } = await supabase
      .from('form_collaborators')
      .select('*')
      .eq('form_id', formId);

    if (error) {
      console.error('Error fetching collaborators:', error);
      // Return empty array if table doesn't exist or RLS denies
      return json({ collaborators: [] });
    }

    return json({ collaborators: collaborators || [] });
  } catch (error) {
    console.error('Error loading collaborators:', error);
    return json({ collaborators: [] });
  }
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies);
  
  const { action, formId, userId, role } = await request.json();

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is form owner
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('user_id')
      .eq('id', formId)
      .single();

    if (formError || !form || form.user_id !== user.id) {
      return json({ error: 'Unauthorized: Only form owner can manage collaborators' }, { status: 403 });
    }

    if (action === 'add') {
      // Add collaborator
      const { error } = await supabase
        .from('form_collaborators')
        .insert({
          form_id: formId,
          user_id: userId,
          role: role || 'editor'
        });

      if (error) {
        if (error.code === '23505') {
          return json({ error: 'User is already a collaborator on this form' }, { status: 400 });
        }
        throw error;
      }

      return json({ success: true, message: 'Collaborator added successfully' });
    } else if (action === 'remove') {
      // Remove collaborator
      const { error } = await supabase
        .from('form_collaborators')
        .delete()
        .eq('form_id', formId)
        .eq('user_id', userId);

      if (error) throw error;

      return json({ success: true, message: 'Collaborator removed successfully' });
    } else if (action === 'update-role') {
      // Update collaborator role
      const { error } = await supabase
        .from('form_collaborators')
        .update({ role })
        .eq('form_id', formId)
        .eq('user_id', userId);

      if (error) throw error;

      return json({ success: true, message: 'Collaborator role updated successfully' });
    }

    return json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing collaborators:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
