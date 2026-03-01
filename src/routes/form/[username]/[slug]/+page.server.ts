import { createSupabaseServerClient } from '$lib/supabaseServer';
import { error } from '@sveltejs/kit';

export async function load({ params, cookies }) {
  const supabase = createSupabaseServerClient(cookies);
  const username = params.username as string;
  const slug = params.slug as string;

  try {
    // Get user by username (indexed query)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (profileError || !profileData) {
      throw error(404, 'User not found');
    }

    // Get the form metadata by user_id and slug (indexed query)
    const { data, error: formError } = await supabase
      .from('forms')
      .select(
        `
          id,
          slug,
          title,
          published,
          closed,
          background_type,
          background_color,
          background_image,
          theme,
          global_text_color,
          enable_checkin
        `
      )
      .eq('user_id', profileData.id)
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (formError || !data) {
      throw error(404, 'Form not found');
    }

    // Check if form is closed
    if (data.closed) {
      throw error(410, 'Form is closed');
    }

    // Fetch questions separately (indexed by form_id)
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select('data')
      .eq('form_id', data.id)
      .order('order_index', { ascending: true });

    if (questionsError) {
      console.error('Error loading questions:', questionsError);
      throw error(500, 'Error loading questions');
    }

    // Extract question data from JSONB wrapper
    const questions = questionsData?.map(q => q.data) || [];

    return {
      form: {
        id: data.id,
        slug: data.slug,
        title: data.title,
        questions,
        published: data.published,
        closed: data.closed || false,
        backgroundType: data.background_type || 'color',
        backgroundColor: data.background_color || '#ffffff',
        backgroundImage: data.background_image || '',
        globalTextColor: data.global_text_color || '',
        theme: data.theme || undefined,
        enable_checkin: data.enable_checkin || false
      }
    };
  } catch (err) {
    console.error('Error loading form:', err);
    // Re-throw if it's already an HTTP error
    if (err instanceof Error && err.message.includes('404|410|500')) {
      throw err;
    }
    throw error(500, 'Error loading form');
  }
}
