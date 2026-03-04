import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { form_responses } from '$lib/server/schema';
import { hashIP, getClientIP, checkRateLimit, logRequest } from '$lib/utils/rateLimit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { formId, answers, device_id, _hp } = data;

    console.log('Incoming response submission:', { formId, answersCount: Object.keys(answers || {}).length });

    // --- Honeypot check: silently discard bot submissions ---
    if (_hp) {
      console.log('Honeypot triggered, silently discarding submission for form:', formId);
      return json({ success: true });
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
    const insertData: any = {
      form_id: formId,
      answers: answers
    };

    if (device_id) {
      insertData.device_id = device_id;
    }

    try {
      const [insertedRow] = await db.insert(form_responses)
        .values(insertData)
        .returning({ id: form_responses.id });

      // Log the request for rate limiting (after successful insert)
      await logRequest(ipHash, formId);

      console.log('Successfully saved response for form:', formId);
      return json({ success: true, submissionId: insertedRow?.id || null });
    } catch (error: any) {
      // Check for unique constraint violation (duplicate device submission)
      // Postgres error code 23505 is unique_violation
      if (error.code === '23505') {
        console.log('Duplicate device submission blocked for form:', formId);
        return json(
          { error: "You've already submitted this form. If you think this is a mistake, please contact the organisers." },
          { status: 409 }
        );
      }

      throw error; // Let the outer catch handle unexpected DB errors
    }
  } catch (error: any) {
    console.error('Unexpected error in response API:', error);
    return json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
};
