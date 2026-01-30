import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { formId, answers } = data;

    console.log('Incoming response submission:', { formId, answersCount: Object.keys(answers || {}).length });

    if (!formId || !answers) {
      console.warn('Submission failed: Missing formId or answers');
      return json({ error: 'Missing formId or answers' }, { status: 400 });
    }

    const { error } = await supabase
      .from('form_responses')
      .insert({
        form_id: formId,
        answers: answers
      });

    if (error) {
      console.error('Supabase error saving response:', error);
      return json({
        error: error.message,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    console.log('Successfully saved response');
    return json({ success: true });
  } catch (error: any) {
    console.error('Unexpected error in response API:', error);
    return json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
};


