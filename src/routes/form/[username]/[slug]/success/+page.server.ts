import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export async function load({ params }) {
  try {
    const username = params.username as string;
    const slug = params.slug as string;

    // Get the user ID from the username
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      throw new Error(`Failed to load profile: ${profileError.message}`);
    }

    if (profileData) {
      // Get the form by user_id and slug
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('background_color, theme, thank_you_page')
        .eq('user_id', profileData.id)
        .eq('slug', slug)
        .single();

      if (formError && formError.code !== 'PGRST116') {
        console.error('Form error:', formError);
        throw new Error(`Failed to load form: ${formError.message}`);
      }

      if (formData) {
        return {
          theme: formData.theme || null,
          backgroundColor: formData.background_color || '#ffffff',
          thankYouPage: formData.thank_you_page || null,
          username,
          slug
        };
      }
    }

    return {
      theme: null,
      backgroundColor: '#ffffff',
      thankYouPage: null,
      username,
      slug
    };
  } catch (error) {
    console.error('Error loading thank you page:', error);
    throw error;
  }
}
