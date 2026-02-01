// src/lib/types.ts
export type ConstraintType = 'email-type' | 'email-domain' | 'text-length' | 'phone-format' | 'number-format' | 'custom-regex';

export interface Constraint {
  id: string;
  type: ConstraintType;
  value: string | string[] | number | { pattern: string; description: string };
}

export interface Question {
  id: string;
  type: 'text' | 'long-text' | 'number' | 'email' | 'phone' | 'date' | 'multiple-choice' | 'dropdown' | 'checkboxes' | 'yes-no' | 'rating';
  title: string;
  required: boolean;
  options?: string[]; // for multiple-choice, dropdown, checkboxes
  min?: number; // for number
  max?: number; // for number
  placeholder?: string; // for text inputs
  constraints?: Constraint[]; // optional constraints for validation
}

export interface Form {
  id: string;
  slug?: string; // Custom identifier for public link (e.g., "data-class")
  title: string;
  questions: Question[];
  published?: boolean;
  closed?: boolean; // Whether the form is closed for submissions
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp for last edit
}

export interface FormResponse {
  id: string;
  formId: string;
  timestamp: number;
  answers: Record<string, string | number | boolean | string[]>;
}