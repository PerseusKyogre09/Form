import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user_themes } from '$lib/server/schema';
import { eq, and, or } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch custom themes created by this user or public ones
    const themesList = await db
      .select()
      .from(user_themes)
      .where(
        or(
          eq(user_themes.user_id, user.id),
          eq(user_themes.is_public, true)
        )
      );

    return json(themesList);
  } catch (error) {
    console.error('Error fetching themes:', error);
    return json({ error: 'Failed to fetch themes' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const {
      id,
      name,
      description,
      font_url,
      css_url,
      custom_css,
      custom_js,
      custom_html_header,
      custom_html_footer,
      colors,
      border_radius,
      input_radius,
      is_public,
    } = data;

    if (!name) {
      return json({ error: 'Theme name is required' }, { status: 400 });
    }

    const themePayload = {
      user_id: user.id,
      name,
      description: description || null,
      font_url: font_url || null,
      css_url: css_url || null,
      custom_css: custom_css || null,
      custom_js: custom_js || null,
      custom_html_header: custom_html_header || null,
      custom_html_footer: custom_html_footer || null,
      colors: colors || {},
      border_radius: typeof border_radius === 'number' ? border_radius : 16,
      input_radius: typeof input_radius === 'number' ? input_radius : 8,
      is_public: !!is_public,
      updated_at: new Date(),
    };

    if (id) {
      // Check ownership before updating
      const existingTheme = await db.query.user_themes.findFirst({
        where: eq(user_themes.id, id),
      });

      if (!existingTheme) {
        return json({ error: 'Theme not found' }, { status: 404 });
      }

      if (existingTheme.user_id !== user.id) {
        return json({ error: 'Unauthorized to modify this theme' }, { status: 403 });
      }

      // Safe update with Drizzle parameterized inputs
      await db
        .update(user_themes)
        .set(themePayload)
        .where(eq(user_themes.id, id));

      console.log('Theme updated successfully:', id);
      return json({ success: true, themeId: id });
    } else {
      // Safe insert with parameterized inputs
      const newThemeId = crypto.randomUUID();
      const insertPayload = {
        ...themePayload,
        id: newThemeId,
      };

      await db.insert(user_themes).values(insertPayload);
      console.log('Theme created successfully:', newThemeId);
      return json({ success: true, themeId: newThemeId });
    }
  } catch (error) {
    console.error('Error saving theme:', error);
    return json({ error: 'Failed to save theme: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ url, locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const themeId = url.searchParams.get('id');
    if (!themeId) {
      return json({ error: 'Missing theme id parameter' }, { status: 400 });
    }

    // Verify ownership before deleting
    const existingTheme = await db.query.user_themes.findFirst({
      where: eq(user_themes.id, themeId),
    });

    if (!existingTheme) {
      return json({ error: 'Theme not found' }, { status: 404 });
    }

    if (existingTheme.user_id !== user.id) {
      return json({ error: 'Unauthorized to delete this theme' }, { status: 403 });
    }

    await db.delete(user_themes).where(eq(user_themes.id, themeId));

    console.log('Theme deleted successfully:', themeId);
    return json({ success: true, message: 'Theme deleted successfully' });
  } catch (error) {
    console.error('Error deleting theme:', error);
    return json({ error: 'Failed to delete theme: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
};
