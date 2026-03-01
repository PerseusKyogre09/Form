import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export async function load({ params }) {
  const username = params.username as string;
  const slug = params.slug as string;

  const defaults = {
    theme: null,
    backgroundColor: '#ffffff',
    thankYouPage: null,
    enableCheckin: false,
    formId: null,
    username,
    slug
  };

  try {
    // Get the user ID from the username
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (profileError || !profileData) {
      console.error('Profile error:', profileError);
      return defaults;
    }

    // Try to get the form with check-in field; fall back without it if column doesn't exist
    let formData: any = null;

    const { data, error } = await supabase
      .from('forms')
      .select('id, background_color, theme, thank_you_page, enable_checkin')
      .eq('user_id', profileData.id)
      .eq('slug', slug)
      .single();

    if (error) {
      // If the error is about the column not existing, retry without it
      if (error.message?.includes('enable_checkin') || error.code === '42703') {
        const { data: fallbackData } = await supabase
          .from('forms')
          .select('id, background_color, theme, thank_you_page')
          .eq('user_id', profileData.id)
          .eq('slug', slug)
          .single();
        formData = fallbackData;
      } else if (error.code !== 'PGRST116') {
        console.error('Form error:', error);
        return defaults;
      }
    } else {
      formData = data;
    }

    if (formData) {
      return {
        theme: formData.theme || null,
        backgroundColor: formData.background_color || '#ffffff',
        thankYouPage: formData.thank_you_page || null,
        enableCheckin: formData.enable_checkin || false,
        formId: formData.id,
        username,
        slug
      };
    }

    return defaults;
  } catch (error) {
    console.error('Error loading thank you page:', error);
    return defaults;
  }
}
