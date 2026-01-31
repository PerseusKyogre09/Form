import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const data = await request.json();

    // Get the current user from the session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate slug from title if not provided
    let slug = data.slug;
    if (!slug && data.title) {
      slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Check if we're updating or inserting
    if (data.id) {
      // Update existing form
      const { error } = await supabase
        .from('forms')
        .update({
          title: data.title,
          questions: data.questions,
          slug: slug,
          published: data.published
        })
        .eq('id', data.id)
        .eq('user_id', session.user.id); // Ensure user owns the form

      if (error) {
        console.error('Error updating form:', error);
        return json({ error: error.message }, { status: 500 });
      }

      return json({ success: true, id: data.id });
    } else {
      // Insert new form
      const { data: newForm, error } = await supabase
        .from('forms')
        .insert({
          title: data.title,
          questions: data.questions,
          slug: slug,
          user_id: session.user.id,
          published: data.published
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating form:', error);
        return json({ error: error.message }, { status: 500 });
      }

      return json({ success: true, id: newForm.id });
    }
  } catch (error) {
    console.error('Error saving form:', error);
    return json({ error: 'Failed to save form' }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ url }) => {
  try {
    const formId = url.searchParams.get('formId');
    const slug = url.searchParams.get('slug');
    const username = url.searchParams.get('username');

    if (username && slug) {
      // Look up by username + slug using the helper function
      const { data, error } = await supabase
        .rpc('get_form_by_username_slug', {
          p_username: username,
          p_slug: slug
        });

      if (error) {
        console.error('Error fetching form by username/slug:', error);
        return json({ error: error.message }, { status: 500 });
      }

      if (!data || data.length === 0) {
        return json({ error: 'Form not found' }, { status: 404 });
      }

      return json(data[0]);
    } else if (slug) {
      // Look up by slug only (for current user's forms)
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('slug', slug)
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching form by slug:', error);
        return json({ error: error.message }, { status: 404 });
      }

      return json(data);
    } else if (formId) {
      // Look up by form ID
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (error) {
        console.error('Error fetching form by ID:', error);
        return json({ error: error.message }, { status: 404 });
      }

      return json(data);
    }

    // Return all forms for the current user
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: forms, error } = await supabase
      .from('forms')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching forms:', error);
      return json({ error: error.message }, { status: 500 });
    }

    return json(forms || []);
  } catch (error) {
    console.error('Error reading forms:', error);
    return json({ error: 'Failed to read forms' }, { status: 500 });
  }
};
