import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { forms, questions as questionsTable, form_responses, form_collaborators } from '$lib/server/schema';
import { eq, and, desc } from 'drizzle-orm';

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

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user;
    const { formId } = params;

    if (!formId) {
      return json({ error: 'Missing formId parameter' }, { status: 400 });
    }

    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the form to check ownership
    const form = await db.query.forms.findFirst({
      where: eq(forms.id, formId)
    });

    if (!form) {
      return json({ error: 'Form not found' }, { status: 404 });
    }

    // Check if user owns the form OR is a collaborator
    if (form.user_id !== user.id) {
      const collaborator = await db.query.form_collaborators.findFirst({
        where: and(
          eq(form_collaborators.form_id, formId),
          eq(form_collaborators.user_id, user.id)
        )
      });

      if (!collaborator) {
        return json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch questions
    const questionsData = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.form_id, formId))
      .orderBy(questionsTable.order_index);

    const questions = questionsData.map(q => q.data as any);

    // Get all responses
    const responseList = await db.select()
      .from(form_responses)
      .where(eq(form_responses.form_id, formId))
      .orderBy(desc(form_responses.created_at));

    // Prepare CSV data
    const csvHeaders = ['Timestamp', 'Response ID'];
    const questionMap = new Map();

    // Add question titles to headers
    questions.forEach((q: any, index: number) => {
      csvHeaders.push(q.title);
      questionMap.set(q.id, index + 2); // +2 because of timestamp and response ID
    });

    const csvData: any[][] = [csvHeaders];

    // Add response data
    responseList.forEach((response: any) => {
      const row = [
        new Date(response.created_at).toLocaleString(),
        response.id
      ];

      // Initialize empty cells
      while (row.length < csvHeaders.length) {
        row.push('');
      }

      // Fill in answers
      const answers = response.answers as Record<string, any>;
      Object.entries(answers || {}).forEach(([questionId, answer]) => {
        const columnIndex = questionMap.get(questionId);
        if (columnIndex !== undefined) {
          let value = '';

          if (answer === null || answer === undefined || answer === '') {
            value = '';
          } else if (typeof answer === 'string') {
            value = answer;
          } else if (typeof answer === 'number') {
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

    // Generate CSV
    const headerRow = csvData[0] as string[];
    const dataRows = csvData.slice(1) as (string | number | boolean | null)[][];
    const csvContent = generateCSV(headerRow, dataRows);

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="form-responses-${formId}.csv"`
      }
    });

  } catch (err: any) {
    console.error('CSV API Error:', err);
    return json({ error: 'Failed to generate CSV', details: String(err) }, { status: 500 });
  }
};