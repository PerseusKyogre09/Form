import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

const supabase = createClient(
  env.PUBLIC_SUPABASE_URL || '',
  env.PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function load({ params }) {
  try {
    const username = params.username as string;
    const slug = params.slug as string;

    // Get the user ID from the username
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (profileData) {
      // Get the form by user_id and slug
      const { data: formData } = await supabase
        .from('forms')
        .select('background_color, theme, thank_you_page')
        .eq('user_id', profileData.id)
        .eq('slug', slug)
        .single();

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
    console.error('Error loading theme:', error);
    return {
      theme: null,
      backgroundColor: '#ffffff',
      thankYouPage: null,
      username: params.username,
      slug: params.slug
    };
  }
}
