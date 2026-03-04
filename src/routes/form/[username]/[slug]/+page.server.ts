import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { forms, questions, user as userTable } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';

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

    const questionsList = questionsData.map(q => q.data);

    return {
      form: {
        id: form.id,
        slug: form.slug,
        title: form.title,
        questions: questionsList,
        published: form.published,
        closed: form.closed || false,
        backgroundType: form.background_type || 'color',
        backgroundColor: form.background_color || '#ffffff',
        backgroundImage: form.background_image || '',
        globalTextColor: form.global_text_color || '',
        theme: form.theme || undefined,
        enable_checkin: form.enable_checkin || false
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
