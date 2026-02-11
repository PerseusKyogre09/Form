import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { hashIP, getClientIP, checkRateLimit, logRequest } from '$lib/utils/rateLimit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { formId, answers, device_id, _hp } = data;

    console.log('Incoming response submission:', { formId, answersCount: Object.keys(answers || {}).length });

    // --- Honeypot check: silently discard bot submissions ---
    if (_hp) {
      console.log('Honeypot triggered, silently discarding submission for form:', formId);
      return json({ success: true }); // Bots think it worked
    }

    if (!formId || !answers) {
      console.warn('Submission failed: Missing formId or answers');
      return json({ error: 'Missing formId or answers' }, { status: 400 });
    }

    // --- IP-based rate limiting ---
    const clientIP = getClientIP(request);
    const ipHash = await hashIP(clientIP);
    const rateCheck = await checkRateLimit(ipHash);

    if (!rateCheck.allowed) {
      console.warn('Rate limit exceeded for IP hash:', ipHash.substring(0, 8) + '...');
      return json(
        { error: 'High traffic detected. Please try again in a few seconds.' },
        {
          status: 429,
          headers: rateCheck.retryAfter
            ? { 'Retry-After': String(rateCheck.retryAfter) }
            : {}
        }
      );
    }

    // --- Insert response with device_id ---
    const insertData: Record<string, any> = {
      form_id: formId,
      answers: answers
    };

    // Only include device_id if provided (preview mode won't have it)
    if (device_id) {
      insertData.device_id = device_id;
    }

    const { error } = await supabase
      .from('form_responses')
      .insert(insertData);

    if (error) {
      // Check for unique constraint violation (duplicate device submission)
      if (error.code === '23505') {
        console.log('Duplicate device submission blocked for form:', formId);
        return json(
          { error: "You've already submitted this form from this device." },
          { status: 409 }
        );
      }

      console.error('Supabase error saving response:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return json({
        error: error.message,
        details: error.details,
        code: error.code
      }, { status: 500 });
    }

    // Log the request for rate limiting (after successful insert)
    await logRequest(ipHash, formId);

    console.log('Successfully saved response for form:', formId);
    return json({ success: true });
  } catch (error: any) {
    console.error('Unexpected error in response API:', error);
    return json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
};
