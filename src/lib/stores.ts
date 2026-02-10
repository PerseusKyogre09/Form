// src/lib/stores.ts
import { writable } from 'svelte/store';
import type { Form, FormElement, ThankYouPage } from './types';

function generateUniqueId(): string {
  // Use crypto.randomUUID() if available, otherwise generate a UUID-like string
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function getDefaultThankYouPage(): ThankYouPage {
  return {
    enabled: false,
    title: 'Thank You!',
    subtitle: 'Your response has been recorded successfully.',
    backgroundType: 'color',
    backgroundColor: '#ffffff',
    backgroundImage: undefined,
    textColor: '#000000',
    titleColor: '#1f2937',
    subtitleColor: '#6b7280',
    successIconColor: '#22c55e',
    buttons: [],
    socialLinks: [],
    showSuccessIcon: true,
    showFormInfo: true
  };
}

export const currentForm = writable<Form>({
  id: generateUniqueId(),
  title: 'My Form',
  questions: [] as FormElement[]
});

export const forms = writable<Form[]>([]);

// Load from localStorage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('forms');
  if (saved) {
    forms.set(JSON.parse(saved));
  }
  forms.subscribe(value => {
    localStorage.setItem('forms', JSON.stringify(value));
  });
}