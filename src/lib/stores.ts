// src/lib/stores.ts
import { writable } from 'svelte/store';
import type { Form, Question } from './types';

function generateUniqueId(): string {
  return 'form_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export const currentForm = writable<Form>({
  id: generateUniqueId(),
  title: 'My Form',
  questions: []
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