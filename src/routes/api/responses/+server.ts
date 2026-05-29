import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { forms, form_responses, ip_rate_log } from '$lib/server/schema';
import { eq, and, count } from 'drizzle-orm';
import { hashIP, getClientIP, checkRateLimit, logRequest } from '$lib/utils/rateLimit';

export const POST: RequestHandler = async ({ request, cookies }) => {
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

    // Fetch form settings to determine secure policies
    const formSettings = await db.query.forms.findFirst({
      where: eq(forms.id, formId),
      columns: {
        enable_device_tracking: true,
        anonymous_voting: true
      }
    });

    if (!formSettings) {
      console.warn('Submission failed: Form not found:', formId);
      return json({ error: 'Form not found' }, { status: 404 });
    }

    // Enforce device_id presence if device tracking or anonymous voting is active
    const requiresDeviceTracking = formSettings.enable_device_tracking || formSettings.anonymous_voting;
    if (requiresDeviceTracking && !device_id) {
      console.warn('Submission failed: Missing device_id for secure form:', formId);
      return json({ error: 'Device verification is required for this form.' }, { status: 400 });
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

    // --- Anti-Ballot Stuffing Check (Signed Cookie + IP Submission Limit) ---
    const cookieName = `form_submitted_${formId}`;
    if (requiresDeviceTracking) {
      // 1. Secure HTTP-only cookie check
      if (cookies.get(cookieName) === 'true') {
        console.log('Duplicate cookie submission blocked for form:', formId);
        return json(
          { error: "You've already submitted this form. If you think this is a mistake, please contact the organisers." },
          { status: 409 }
        );
      }

      // 2. IP Submission Count check (protect against automated script spoofing of device_id)
      const [ipSubmissionCount] = await db
        .select({ value: count() })
        .from(ip_rate_log)
        .where(
          and(
            eq(ip_rate_log.ip_hash, ipHash),
            eq(ip_rate_log.form_id, formId)
          )
        );

      if ((ipSubmissionCount.value ?? 0) >= 3) {
        console.warn('Ballot stuffing blocked: IP has exceeded maximum anonymous submissions for form:', formId);
        return json(
          { error: "Submission limit exceeded for this network. To ensure fairness, we restrict duplicate entries." },
          { status: 429 }
        );
      }
    }

    // --- Insert response with device_id ---
    const insertData: any = {
      form_id: formId,
      answers: answers
    };

    if (device_id) {
      if (requiresDeviceTracking) {
        // Cryptographically hash the device ID salted with form ID
        // Ensures user anonymity and prevents cross-form correlation!
        const secureDeviceIdRaw = `${device_id}_${formId}`;
        const encoder = new TextEncoder();
        const cryptoData = encoder.encode(secureDeviceIdRaw);
        const hashBuffer = await crypto.subtle.digest('SHA-256', cryptoData);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        insertData.device_id = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } else {
        // Standard device ID (fallback)
        insertData.device_id = device_id;
      }
    }

    try {
      const [insertedRow] = await db.insert(form_responses)
        .values(insertData)
        .returning({ id: form_responses.id });

      // Log the request for rate limiting (after successful insert)
      await logRequest(ipHash, formId);

      // Set a secure, long-lived HTTP-only cookie to prevent subsequent browser-based attempts
      if (requiresDeviceTracking) {
        cookies.set(cookieName, 'true', {
          path: '/',
          maxAge: 60 * 60 * 24 * 365, // 1 year
          httpOnly: true,
          secure: true,
          sameSite: 'strict'
        });
      }

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
