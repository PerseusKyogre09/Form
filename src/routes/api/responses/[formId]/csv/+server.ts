import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$lib/supabaseServer';


// Simple CSV escape function
function escapeCSV(value: string): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

// Generate CSV content from data
function generateCSV(headers: string[], rows: (string | number | boolean | null)[][]): string {
  const lines: string[] = [];
  
  // Add header
  lines.push(headers.map(h => escapeCSV(String(h))).join(','));
  
  // Add rows
  rows.forEach(row => {
    lines.push(row.map(cell => escapeCSV(String(cell || ''))).join(','));
  });
  
  return lines.join('\n');
}

export const GET: RequestHandler = async ({ params, request, cookies }) => {
  try {
    const supabase = createSupabaseServerClient(cookies);
    const { formId } = params;
    console.log('CSV API: Request received for formId:', formId);

    if (!formId) {
      console.log('CSV API: Missing formId parameter');
      return json({ error: 'Missing formId parameter' }, { status: 400 });
    }

    // Get the current user from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('CSV API: No authorization header');
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.log('CSV API: User auth failed:', userError);
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('CSV API: User authenticated:', user.id);

    // Get the form to check ownership
    console.log('CSV API: Fetching form data...');
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, title, user_id')
      .eq('id', formId)
      .single();

    if (formError) {
      console.error('CSV API: Error fetching form:', formError);
      return json({ error: 'Form not found', details: formError.message }, { status: 404 });
    }

    // Check if user owns the form
    if (form.user_id !== user.id) {
      console.log('CSV API: User does not own this form');
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch questions separately
    console.log('CSV API: Fetching questions...');
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select('id, data')
      .eq('form_id', formId)
      .order('order_index', { ascending: true });

    if (questionsError) {
      console.error('CSV API: Error fetching questions:', questionsError);
      // Continue without questions - might be a form with no questions
    }

    const questions = questionsData?.map(q => q.data) || [];
    console.log('CSV API: Form found:', { id: form.id, title: form.title, questionsCount: questions.length });

    // Get all responses for this form
    console.log('CSV API: Fetching responses...');
    const { data: responses, error: responsesError } = await supabase
      .from('form_responses')
      .select('id, created_at, answers')
      .eq('form_id', formId)
      .order('created_at', { ascending: false });

    if (responsesError) {
      console.error('CSV API: Error fetching responses:', responsesError);
      throw error(500, 'Failed to fetch responses');
    }
    const responseList = responses || [];
    console.log('CSV API: Found', responseList.length, 'responses');

    // Prepare CSV data
    console.log('CSV API: Preparing CSV data...');
    const csvHeaders = ['Timestamp', 'Response ID'];
    const questionMap = new Map();

    // Add question titles to headers
    questions.forEach((q: any, index: number) => {
      csvHeaders.push(q.title);
      questionMap.set(q.id, index + 2); // +2 because of timestamp and response ID
    });
    console.log('CSV API: Headers created:', csvHeaders);

    const csvData = [csvHeaders];
    console.log('CSV API: Processing', responseList.length, 'responses...');

    // Add response data
    responseList.forEach((response: any, index: number) => {
      if (index < 3) { // Log first few responses
        console.log(`CSV API: Processing response ${index + 1}:`, { id: response.id, answersCount: Object.keys(response.answers || {}).length });
      }

      const row = [
        new Date(response.created_at).toLocaleString(),
        response.id
      ];

      // Initialize empty cells for all questions
      while (row.length < csvHeaders.length) {
        row.push('');
      }

      // Fill in answers
      Object.entries(response.answers || {}).forEach(([questionId, answer]) => {
        const columnIndex = questionMap.get(questionId);
        if (columnIndex !== undefined) {
          let value = '';

          if (answer === null || answer === undefined || answer === '') {
            value = '';
          } else if (typeof answer === 'string') {
            value = answer;
          } else if (typeof answer === 'number') {
            // Check if this is a rating question
            const question = questions.find((q: any) => q.id === questionId);
            if (question && question.type === 'rating') {
              value = `${answer}/5`;
            } else {
              value = String(answer);
            }
          } else if (typeof answer === 'boolean') {
            value = answer ? 'Yes' : 'No';
          } else if (Array.isArray(answer)) {
            value = answer.join('; ');
          } else {
            value = String(answer);
          }

          row[columnIndex] = value;
        }
      });

      csvData.push(row);
    });

    console.log('CSV API: CSV data prepared, rows:', csvData.length);

    // Generate CSV
    console.log('CSV API: Generating CSV string...');
    const headerRow = csvData[0] as string[];
    const dataRows = csvData.slice(1) as (string | number | boolean | null)[][];
    const csvContent = generateCSV(headerRow, dataRows);
    console.log('CSV API: CSV generated, length:', csvContent.length);

    // Return CSV file with proper headers
    console.log('CSV API: Returning CSV response with proper headers');
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="form-responses-${formId}.csv"`
      }
    });

  } catch (err: any) {
    console.error('CSV API: Error in endpoint:', err);
    return json({ error: 'Failed to generate CSV', details: String(err) }, { status: 500 });
  }
};