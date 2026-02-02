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

export type AnimationType = 'fade' | 'slide' | 'pulse';
export type AnimationRepeatMode = 'once' | 'loop' | 'times';

export interface AnimationElement {
  id: string;
  kind: 'animation';
  title: string;
  description?: string;
  assetUrl?: string;
  animationType: AnimationType;
  backgroundColor?: string; // hex color, defaults to transparent
  enableAutoAdvance?: boolean; // auto-advance to next after delay
  autoAdvanceDelay?: number; // delay in seconds before auto-advance
  repeatMode?: AnimationRepeatMode; // 'once', 'loop', or 'times'
  repeatCount?: number; // number of times to repeat if repeatMode === 'times'
}

export type FormElement = Question | AnimationElement;

export interface Form {
  id: string;
  slug?: string; // Custom identifier for public link (e.g., "data-class")
  title: string;
  questions: FormElement[];
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

export function isAnimationElement(element: FormElement): element is AnimationElement {
  return (element as AnimationElement).kind === 'animation';
}

export function isQuestionElement(element: FormElement): element is Question {
  return !isAnimationElement(element);
}