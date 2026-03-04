import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { forms, form_collaborators, user as userTable } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  const formId = params.formId;

  if (!formId) return json({ error: 'Missing formId' }, { status: 400 });

  try {
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

    // 1. First verify the requester is the owner of the form
    const form = await db.query.forms.findFirst({
      where: eq(forms.id, formId),
      columns: { user_id: true }
    });

    if (!form) return json({ error: 'Form not found' }, { status: 404 });

    if (form.user_id !== user.id) {
      // If not owner, check if they are a collaborator
      const isCollab = await db.query.form_collaborators.findFirst({
        where: and(
          eq(form_collaborators.form_id, formId),
          eq(form_collaborators.user_id, user.id)
        )
      });

      if (!isCollab) {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // 2. Fetch all collaborators and their user profiles
    const collaborators = await db.select({
      id: form_collaborators.id,
      form_id: form_collaborators.form_id,
      user_id: form_collaborators.user_id,
      role: form_collaborators.role,
      created_at: form_collaborators.created_at,
      user: {
        id: userTable.id,
        username: userTable.username
      }
    })
      .from(form_collaborators)
      .innerJoin(userTable, eq(form_collaborators.user_id, userTable.id))
      .where(eq(form_collaborators.form_id, formId));

    return json({ collaborators });
  } catch (error) {
    console.error('Error loading collaborators:', error);
    return json({ collaborators: [] });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  const { action, formId, userId, role } = await request.json();

  try {
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

    // Check if user is form owner
    const form = await db.query.forms.findFirst({
      where: eq(forms.id, formId),
      columns: { user_id: true }
    });

    if (!form || form.user_id !== user.id) {
      return json({ error: 'Unauthorized: Only form owner can manage collaborators' }, { status: 403 });
    }

    if (action === 'add') {
      try {
        await db.insert(form_collaborators).values({
          form_id: formId,
          user_id: userId,
          role: role || 'editor'
        });
        return json({ success: true, message: 'Collaborator added successfully' });
      } catch (error: any) {
        if (error.code === '23505') {
          return json({ error: 'User is already a collaborator on this form' }, { status: 400 });
        }
        throw error;
      }
    } else if (action === 'remove') {
      await db.delete(form_collaborators)
        .where(
          and(
            eq(form_collaborators.form_id, formId),
            eq(form_collaborators.user_id, userId)
          )
        );

      return json({ success: true, message: 'Collaborator removed successfully' });
    } else if (action === 'update-role') {
      await db.update(form_collaborators)
        .set({ role })
        .where(
          and(
            eq(form_collaborators.form_id, formId),
            eq(form_collaborators.user_id, userId)
          )
        );

      return json({ success: true, message: 'Collaborator role updated successfully' });
    }

    return json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing collaborators:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
