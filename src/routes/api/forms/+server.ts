import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { forms, questions, form_collaborators, user as userTable } from '$lib/server/schema';
import { eq, and, or, inArray, desc } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    console.log('POST /api/forms - received data:', { id: data.id, title: data.title });

    // Generate slug from title if not provided
    let slug = data.slug;
    if (!slug && data.title) {
      slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Extract questions table data from payload
    const questionsData = data.questions || [];
    const { questions: _, collaborators: __, user: ___, ...formPayload } = data;

    // Check if form exists and verify permissions
    let ownerId = user.id;

    if (data.id) {
      const existingForm = await db.query.forms.findFirst({
        where: eq(forms.id, data.id)
      });

      if (existingForm) {
        ownerId = existingForm.user_id;

        // If user is not owner, check if they are an editor
        if (existingForm.user_id !== user.id) {
          const collaborator = await db.query.form_collaborators.findFirst({
            where: and(
              eq(form_collaborators.form_id, data.id),
              eq(form_collaborators.user_id, user.id)
            )
          });

          if (!collaborator || collaborator.role !== 'editor') {
            return json({ error: 'Unauthorized: You do not have permission to edit this form' }, { status: 403 });
          }
        }
      }
    }

    // Prepare form payload
    const finalFormPayload = {
      ...formPayload,
      user_id: ownerId,
      slug: slug,
      updated_at: new Date(),
    };

    // Use upsert-like logic with Drizzle (Neon Postgres)
    if (data.id) {
      await db.update(forms)
        .set(finalFormPayload)
        .where(eq(forms.id, data.id));
    } else {
      const [newForm] = await db.insert(forms).values(finalFormPayload).returning({ id: forms.id });
      data.id = newForm.id;
    }

    // Handle questions (Delete old, insert new)
    await db.delete(questions).where(eq(questions.form_id, data.id));

    if (questionsData.length > 0) {
      const questionsToInsert = questionsData.map((q: any, index: number) => ({
        form_id: data.id,
        data: q,
        order_index: index,
        updated_at: new Date()
      }));

      await db.insert(questions).values(questionsToInsert);
    }

    console.log('POST /api/forms - Successfully saved form and questions:', data.id);
    return json({ success: true, id: data.id });
  } catch (error) {
    console.error('Error saving form:', error);
    return json({ error: 'Failed to save form: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ url, locals }) => {
  const user = locals.user;

  try {
    const formId = url.searchParams.get('formId');
    const slug = url.searchParams.get('slug');
    const username = url.searchParams.get('username');

    if (username && slug) {
      // Look up by username + slug
      const result = await db.select({
        form: forms,
      })
        .from(forms)
        .innerJoin(userTable, eq(forms.user_id, userTable.id))
        .where(and(
          eq(userTable.username, username),
          eq(forms.slug, slug)
        ));

      if (result.length === 0) {
        return json({ error: 'Form not found' }, { status: 404 });
      }

      // Fetch questions for this form
      const questionsData = await db.select()
        .from(questions)
        .where(eq(questions.form_id, result[0].form.id))
        .orderBy(questions.order_index);

      return json({
        ...result[0].form,
        questions: questionsData.map(q => q.data)
      });
    } else if (slug) {
      const form = await db.query.forms.findFirst({
        where: eq(forms.slug, slug)
      });

      if (!form) {
        return json({ error: 'Form not found' }, { status: 404 });
      }

      const questionsData = await db.select()
        .from(questions)
        .where(eq(questions.form_id, form.id))
        .orderBy(questions.order_index);

      return json({
        ...form,
        questions: questionsData.map(q => q.data)
      });
    } else if (formId) {
      const form = await db.query.forms.findFirst({
        where: eq(forms.id, formId)
      });

      if (!form) {
        return json({ error: 'Form not found' }, { status: 404 });
      }

      const questionsData = await db.select()
        .from(questions)
        .where(eq(questions.form_id, form.id))
        .orderBy(questions.order_index);

      return json({
        ...form,
        questions: questionsData.map(q => q.data)
      });
    }

    // Return all forms for the current user
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

    const userForms = await db.select({
      form: forms
    })
      .from(forms)
      .leftJoin(form_collaborators, eq(forms.id, form_collaborators.form_id))
      .where(or(
        eq(forms.user_id, user.id),
        eq(form_collaborators.user_id, user.id)
      ))
      .orderBy(desc(forms.updated_at));

    const formsList = Array.from(new Map(userForms.map(item => [item.form.id, item.form])).values());

    if (formsList.length > 0) {
      const formIds = formsList.map(f => f.id);
      const allQuestions = await db.select()
        .from(questions)
        .where(inArray(questions.form_id, formIds))
        .orderBy(questions.form_id, questions.order_index);

      const questionsMap: Record<string, any[]> = {};
      allQuestions.forEach(q => {
        if (!questionsMap[q.form_id]) questionsMap[q.form_id] = [];
        questionsMap[q.form_id].push(q.data);
      });

      return json(formsList.map(f => ({
        ...f,
        questions: questionsMap[f.id] || []
      })));
    }

    return json(formsList);
  } catch (error) {
    console.error('Error reading forms:', error);
    return json({ error: 'Failed to read forms' }, { status: 500 });
  }
};
