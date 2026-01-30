import { json } from '@sveltejs/kit';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { RequestHandler } from './$types';

const FORMS_DIR = join(process.cwd(), 'data');

// Ensure data directory exists
if (!existsSync(FORMS_DIR)) {
  mkdirSync(FORMS_DIR, { recursive: true });
}

const FORMS_FILE = join(FORMS_DIR, 'forms.json');

function getAllForms() {
  if (!existsSync(FORMS_FILE)) {
    return [];
  }
  try {
    const content = readFileSync(FORMS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function saveForms(forms: any[]) {
  writeFileSync(FORMS_FILE, JSON.stringify(forms, null, 2));
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const forms = getAllForms();
    
    const existingIndex = forms.findIndex((f: any) => f.id === data.id);
    if (existingIndex >= 0) {
      forms[existingIndex] = data;
    } else {
      forms.push(data);
    }
    
    saveForms(forms);
    return json({ success: true });
  } catch (error) {
    console.error('Error saving form:', error);
    return json({ error: 'Failed to save form' }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ url }) => {
  try {
    const formId = url.searchParams.get('formId');
    const slug = url.searchParams.get('slug');
    const forms = getAllForms();
    
    if (slug) {
      // Look up by slug
      const form = forms.find((f: any) => f.slug === slug);
      if (!form) {
        return json({ error: 'Form not found' }, { status: 404 });
      }
      return json(form);
    } else if (formId) {
      // Look up by form ID
      const form = forms.find((f: any) => f.id === formId);
      if (!form) {
        return json({ error: 'Form not found' }, { status: 404 });
      }
      return json(form);
    }
    
    return json(forms);
  } catch (error) {
    console.error('Error reading forms:', error);
    return json({ error: 'Failed to read forms' }, { status: 500 });
  }
};
