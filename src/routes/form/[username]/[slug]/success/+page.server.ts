import { db } from '$lib/server/db';
import { forms, user as userTable } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';

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
    const profile = await db.query.user.findFirst({
      where: eq(userTable.username, username),
      columns: { id: true }
    });

    if (!profile) {
      console.error('Profile not found');
      return defaults;
    }

    // Try to get the form
    const formData = await db.query.forms.findFirst({
      where: and(eq(forms.user_id, profile.id), eq(forms.slug, slug)),
      columns: {
        id: true,
        background_color: true,
        theme: true,
        thank_you_page: true,
        enable_checkin: true
      }
    });

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
