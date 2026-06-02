import { db } from '$lib/server/db';
import { forms, user as userTable, user_themes } from '$lib/server/schema';
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
      // Dynamically resolve the absolute latest custom theme layout from master user_themes table
      let activeTheme = formData.theme || null;
      if (activeTheme && typeof activeTheme === 'object' && (activeTheme as any).id) {
        try {
          const masterTheme = await db.query.user_themes.findFirst({
            where: eq(user_themes.id, (activeTheme as any).id)
          });
          if (masterTheme) {
            activeTheme = {
              id: masterTheme.id,
              name: masterTheme.name,
              description: masterTheme.description || "",
              fontUrl: masterTheme.font_url || "",
              colors: masterTheme.colors || {},
              layout: (masterTheme.colors as any)?.layout || undefined,
              border_radius: masterTheme.border_radius ?? 16,
              input_radius: masterTheme.input_radius ?? 8,
              customCss: masterTheme.custom_css || "",
              customJs: masterTheme.custom_js || "",
              customHtmlHeader: masterTheme.custom_html_header || "",
              customHtmlFooter: masterTheme.custom_html_footer || "",
            } as any;
          }
        } catch (themeErr) {
          console.warn('Failed to load master theme for success page, using snapshot:', themeErr);
        }
      }

      return {
        theme: activeTheme,
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
