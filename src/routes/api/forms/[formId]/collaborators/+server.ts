import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SUPABASE_SERVICE_KEY } from '$env/static/private';

// Create a service role client for administrative tasks (bypasses RLS)
const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, PRIVATE_SUPABASE_SERVICE_KEY);

export const GET: RequestHandler = async ({ url, params, cookies }) => {
  const supabase = createSupabaseServerClient(cookies);
  const formId = params.formId;

  try {
    // 1. First verify the requester is the owner of the form
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

    const { data: form } = await supabaseAdmin
      .from('forms')
      .select('user_id')
      .eq('id', formId)
      .single();

    if (!form || form.user_id !== user.id) {
      // If not owner, check if they are a collaborator (they should be able to see themselves)
      const { data: isCollab } = await supabaseAdmin
        .from('form_collaborators')
        .select('id')
        .eq('form_id', formId)
        .eq('user_id', user.id)
        .single();

      if (!isCollab) {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // 2. Fetch all collaborators using admin client to bypass RLS issues
    const { data: collaborators, error } = await supabaseAdmin
      .from('form_collaborators')
      .select('*')
      .eq('form_id', formId);

    if (error) {
      console.error('[API] Error fetching collaborators:', error);
      return json({ collaborators: [] });
    }

    if (!collaborators || collaborators.length === 0) {
      return json({ collaborators: [] });
    }

    // 3. Fetch profiles for these users
    const userIds = collaborators.map(c => c.user_id);
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .in('id', userIds);

    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const mappedCollaborators = collaborators.map(c => ({
      ...c,
      user: profilesMap.get(c.user_id) || { id: c.user_id, username: null }
    }));

    return json({ collaborators: mappedCollaborators });
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
