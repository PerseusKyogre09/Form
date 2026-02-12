import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

export async function load({ params }) {
  try {
    // Validate environment variables
    if (!env.PUBLIC_SUPABASE_URL || !env.PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase environment variables not configured');
      return {
        theme: null,
        backgroundColor: '#ffffff',
        thankYouPage: null,
        username: params.username,
        slug: params.slug
      };
    }

    const supabase = createClient(
      env.PUBLIC_SUPABASE_URL,
      env.PUBLIC_SUPABASE_ANON_KEY
    );

    const username = params.username as string;
    const slug = params.slug as string;

    // Get the user ID from the username
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (profileError || !profileData) {
      console.warn('Profile not found for username:', username);
      return {
        theme: null,
        backgroundColor: '#ffffff',
        thankYouPage: null,
        username,
        slug
      };
    }

    // Get the form by user_id and slug
    const { data: formData, error: formError } = await supabase
      .from('forms')
      .select('background_color, theme, thank_you_page')
      .eq('user_id', profileData.id)
      .eq('slug', slug)
      .single();

    if (formError || !formData) {
      console.warn('Form not found for slug:', slug);
      return {
        theme: null,
        backgroundColor: '#ffffff',
        thankYouPage: null,
        username,
        slug
      };
    }

    return {
      theme: formData.theme || null,
      backgroundColor: formData.background_color || '#ffffff',
      thankYouPage: formData.thank_you_page || null,
      username,
      slug
    };
  } catch (error) {
    console.error('Error loading success page data:', error);
    return {
      theme: null,
      backgroundColor: '#ffffff',
      thankYouPage: null,
      username: params.username,
      slug: params.slug
    };
  }
}
