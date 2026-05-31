import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { forms, questions, user as userTable, user_themes } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';
import type { FormElement } from '$lib/types';

export async function load({ params }) {
  const username = params.username as string;
  const slug = params.slug as string;

  try {
    // Get user by username
    const profile = await db.query.user.findFirst({
      where: eq(userTable.username, username),
      columns: { id: true }
    });

    if (!profile) {
      throw error(404, 'User not found');
    }

    // Get the form metadata by user_id and slug
    const form = await db.query.forms.findFirst({
      where: and(
        eq(forms.user_id, profile.id),
        eq(forms.slug, slug),
        eq(forms.published, true)
      )
    });

    if (!form) {
      throw error(404, 'Form not found');
    }

    // Check if form is closed
    if (form.closed) {
      throw error(410, 'Form is closed');
    }

    // Fetch questions separately
    const questionsData = await db.select({ data: questions.data })
      .from(questions)
      .where(eq(questions.form_id, form.id))
      .orderBy(questions.order_index);

    const questionsList = questionsData.map(q => q.data) as FormElement[];

    // Dynamically resolve the absolute latest custom theme layout from master user_themes table
    let activeTheme = form.theme || undefined;
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
            border_radius: masterTheme.border_radius ?? 16,
            input_radius: masterTheme.input_radius ?? 8,
            customCss: masterTheme.custom_css || "",
            customJs: masterTheme.custom_js || "",
            customHtmlHeader: masterTheme.custom_html_header || "",
            customHtmlFooter: masterTheme.custom_html_footer || "",
          } as any;
        }
      } catch (themeErr) {
        console.warn('Failed to load master theme for public form, using snapshot:', themeErr);
      }
    }

    return {
      form: {
        id: form.id,
        user_id: form.user_id,
        slug: form.slug,
        title: form.title,
        questions: questionsList,
        published: form.published,
        closed: form.closed || false,
        backgroundType: (form.background_type || 'color') as 'color' | 'image',
        backgroundColor: form.background_color || '#ffffff',
        backgroundImage: form.background_image || '',
        globalTextColor: form.global_text_color || '',
        theme: activeTheme,
        enable_checkin: form.enable_checkin || false,
        enable_device_tracking: form.enable_device_tracking || false,
        anonymous_voting: form.anonymous_voting || false
      }
    };
  } catch (err: any) {
    console.error('Error loading form:', err);
    // Re-throw if it's already an HTTP error
    if (err?.status) {
      throw err;
    }
    throw error(500, 'Error loading form');
  }
}
