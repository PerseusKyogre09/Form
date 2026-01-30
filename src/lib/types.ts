// src/lib/types.ts
export interface Question {
  id: string;
  type: 'text' | 'multiple-choice' | 'yes-no' | 'rating';
  title: string;
  required: boolean;
  options?: string[]; // for multiple-choice
}

export interface Form {
  id: string;
  slug?: string; // Custom identifier for public link (e.g., "data-class")
  title: string;
  questions: Question[];
}

export interface FormResponse {
  id: string;
  formId: string;
  timestamp: number;
  answers: Record<string, string | number | boolean>;
}