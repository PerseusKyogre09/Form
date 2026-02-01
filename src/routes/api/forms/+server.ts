import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const data = await request.json();
    console.log('POST /api/forms - received data:', { id: data.id, title: data.title });

    // Get the current user from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('POST /api/forms - No authorization header');
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    console.log('POST /api/forms - Got token, attempting to get user...');
    
    // For server-side token verification, we need to use the service role key
    // Since we don't have that, we'll trust the client's user_id in the payload
    // and verify it's the same user making the request by checking the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      console.log('POST /api/forms - User error:', userError);
      return json({ error: 'Unauthorized: ' + userError.message }, { status: 401 });
    }

    if (!user) {
      console.log('POST /api/forms - No user found in token');
      return json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    console.log('POST /api/forms - Got user:', user.id);

    // Generate slug from title if not provided
    let slug = data.slug;
    if (!slug && data.title) {
      slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Ensure form has correct user_id
    const formPayload = {
      ...data,
      user_id: user.id,
      slug: slug,
    };

    console.log('POST /api/forms - Upserting form:', { id: formPayload.id, user_id: formPayload.user_id });

    // Use upsert to handle both create and update
    const { error } = await supabase
      .from('forms')
      .upsert(formPayload);

    if (error) {
      console.error('Error upserting form:', error);
      return json({ error: error.message }, { status: 500 });
    }

    console.log('POST /api/forms - Successfully saved form:', formPayload.id);
    return json({ success: true, id: data.id });
  } catch (error) {
    console.error('Error saving form:', error);
    return json({ error: 'Failed to save form: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ url, request }) => {
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
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return json({ error: 'Unauthorized' }, { status: 401 });
      }

      const token = authHeader.substring(7);
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('slug', slug)
        .eq('user_id', user.id)
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
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: forms, error } = await supabase
      .from('forms')
      .select('*')
      .eq('user_id', user.id)
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
