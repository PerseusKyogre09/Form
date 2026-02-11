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

    // Extract questions from payload
    const questions = data.questions || [];
    const { questions: _, ...formPayload } = data; // Exclude questions from form

    // Ensure form has correct user_id
    const finalFormPayload = {
      ...formPayload,
      user_id: user.id,
      slug: slug,
      updated_at: new Date().toISOString(),
    };

    console.log('POST /api/forms - Upserting form:', { id: finalFormPayload.id, user_id: finalFormPayload.user_id });

    // Use upsert to handle both create and update
    const { error: formError } = await supabase
      .from('forms')
      .upsert(finalFormPayload);

    if (formError) {
      console.error('Error upserting form:', formError);
      return json({ error: formError.message }, { status: 500 });
    }

    // Delete existing questions for this form
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('form_id', data.id);

    if (deleteError) {
      console.error('Error deleting old questions:', deleteError);
      // Don't fail the whole operation, just log it
    }

    // Insert new questions
    if (questions.length > 0) {
      const questionsData = questions.map((q: any, index: number) => ({
        form_id: data.id,
        data: q,
        order_index: index
      }));

      const { error: insertError } = await supabase
        .from('questions')
        .insert(questionsData);

      if (insertError) {
        console.error('Error inserting questions:', insertError);
        return json({ error: 'Form saved but failed to save questions: ' + insertError.message }, { status: 500 });
      }
    }

    console.log('POST /api/forms - Successfully saved form and questions:', finalFormPayload.id);
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
        .select('id, created_at, title, user_id, slug, published, closed, background_type, background_color, background_image, theme, global_text_color, updated_at, thank_you_page')
        .eq('slug', slug)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching form by slug:', error);
        return json({ error: error.message }, { status: 404 });
      }

      // Fetch questions for this form
      const { data: questionsData } = await supabase
        .from('questions')
        .select('data')
        .eq('form_id', data.id)
        .order('order_index', { ascending: true });

      return json({
        ...data,
        questions: questionsData?.map(q => q.data) || (data.questions || [])
      });
    } else if (formId) {
      // Look up by form ID
      const { data, error } = await supabase
        .from('forms')
        .select('id, created_at, title, user_id, slug, published, closed, background_type, background_color, background_image, theme, global_text_color, updated_at, thank_you_page')
        .eq('id', formId)
        .single();

      if (error) {
        console.error('Error fetching form by ID:', error);
        return json({ error: error.message }, { status: 404 });
      }

      // Fetch questions for this form
      const { data: questionsData } = await supabase
        .from('questions')
        .select('data')
        .eq('form_id', data.id)
        .order('order_index', { ascending: true });

      return json({
        ...data,
        questions: questionsData?.map(q => q.data) || (data.questions || [])
      });
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

    let { data: forms, error } = await supabase
      .from('forms')
      .select('id, created_at, title, user_id, slug, published, closed, background_type, background_color, background_image, theme, global_text_color, updated_at, thank_you_page')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching forms:', error);
      return json({ error: error.message }, { status: 500 });
    }

    // Fetch questions for all forms
    if (forms && forms.length > 0) {
      const formIds = forms.map(f => f.id);
      const { data: allQuestions } = await supabase
        .from('questions')
        .select('form_id, data')
        .in('form_id', formIds)
        .order('form_id, order_index', { ascending: true });

      // Map questions back to forms
      const questionsMap: Record<string, any[]> = {};
      allQuestions?.forEach(q => {
        if (!questionsMap[q.form_id]) {
          questionsMap[q.form_id] = [];
        }
        questionsMap[q.form_id].push(q.data);
      });

      forms = forms.map(f => ({
        ...f,
        questions: questionsMap[f.id] || []
      }));
    } else if (forms) {
      // Ensure all forms have questions array even if no questions table entries
      forms = forms.map(f => ({
        ...f,
        questions: f.questions || []
      }));
    }

    return json(forms || []);
  } catch (error) {
    console.error('Error reading forms:', error);
    return json({ error: 'Failed to read forms' }, { status: 500 });
  }
};
