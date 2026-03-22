import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { FORM_TEMPLATES } from '$lib/templates';
import { randomUUID } from 'crypto';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { templateId } = await request.json();
    
    // Find the template
    const template = FORM_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      return json({ error: 'Template not found' }, { status: 404 });
    }

    // Generate a unique form ID
    const formId = randomUUID();

    // Create form data from template
    const formData = {
      id: formId,
      title: template.name,
      slug: template.id + '-' + Date.now(),
      background_color: template.background_color || '#ffffff',
      questions: template.questions_template,
      user_id: user.id,
    };

    // Create the form via the main forms endpoint
    const createFormRes = await fetch(new URL('/api/forms', request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(formData),
    });

    if (!createFormRes.ok) {
      const error = await createFormRes.json();
      throw new Error(error.error || 'Failed to create form from template');
    }

    const newForm = await createFormRes.json();

    return json({ 
      formId: newForm.id,
      message: `Form created from template: ${template.name}`
    });
  } catch (error: any) {
    console.error('Error creating form from template:', error);
    return json({ error: error.message || 'Failed to create form from template' }, { status: 500 });
  }
};
