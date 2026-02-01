import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SUPABASE_SERVICE_KEY } from '$env/static/private';

// Create a service role client that bypasses RLS for admin operations
const supabaseAdmin = createClient(
  PUBLIC_SUPABASE_URL,
  PRIVATE_SUPABASE_SERVICE_KEY
);

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

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { formId } = params;
    console.log('CSV API: Request received for formId:', formId);

    if (!formId) {
      console.log('CSV API: Missing formId parameter');
      return json({ error: 'Missing formId parameter' }, { status: 400 });
    }

    // Get the form to check ownership and get questions
    console.log('CSV API: Fetching form data...');
    const { data: form, error: formError } = await supabaseAdmin
      .from('forms')
      .select('id, title, questions, user_id')
      .eq('id', formId)
      .single();

    if (formError) {
      console.error('CSV API: Error fetching form:', formError);
      return json({ error: 'Form not found' }, { status: 404 });
    }
    console.log('CSV API: Form found:', { id: form.id, title: form.title, questionsCount: form.questions?.length });

    // Get all responses for this form
    console.log('CSV API: Fetching responses...');
    const { data: responses, error: responsesError } = await supabaseAdmin
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
    form.questions.forEach((q: any, index: number) => {
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
            const question = form.questions.find((q: any) => q.id === questionId);
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