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
  exitAnimation?: AnimationType; // optional animation when transitioning to next question
}

export type AnimationType = 'fade' | 'slide' | 'pulse' | 'bounce' | 'zoom' | 'flip' | 'rotate' | 'slideLeft' | 'slideRight' | 'wobble' | 'heartbeat' | 'swing' | 'tada' | 'jello' | 'blink';
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

export interface Theme {
  id: string;
  name: string;
  description?: string;
  cssUrl?: string; // External CSS URL (e.g., for NES.css)
  fontUrl?: string; // External font URL (e.g., Google Fonts)
  customCss?: string; // Custom CSS as string
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
}

export interface Form {
  id: string;
  slug?: string; // Custom identifier for public link (e.g., "data-class")
  title: string;
  questions: FormElement[];
  published?: boolean;
  closed?: boolean; // Whether the form is closed for submissions
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp for last edit
  background_type?: 'color' | 'image'; // 'color' or 'image'
  background_color?: string; // hex color for background
  background_image?: string; // URL or base64 for background image
  // Support both camelCase and snake_case for compatibility
  backgroundType?: 'color' | 'image';
  backgroundColor?: string;
  backgroundImage?: string;
  theme?: Theme; // Optional theme configuration
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