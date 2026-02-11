// src/lib/types.ts
export type ConstraintType = 'email-type' | 'email-domain' | 'text-length' | 'phone-format' | 'number-format' | 'custom-regex' | 'selection-count' | 'date-range';

export interface Constraint {
  id: string;
  type: ConstraintType;
  value: any; // Using any for flexibility with complex objects like {min, max} or {pattern, description}
}

export interface QuestionCondition {
  questionId: string;
  operator: 'equals' | 'not_equals' | 'contains';
  value: string;
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
  // Text styling options
  fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  fontFamily?: 'serif' | 'sans' | 'mono';
  textAlign?: 'left' | 'center' | 'right';
  questionLabel?: string; // e.g., "QUESTION 01 — 05"
  helperText?: string; // Subtitle/description below title
  accentColor?: string; // For highlighted words in title
  textColor?: string; // Override default text color
  condition?: QuestionCondition; // Show this question only if condition is met
}

export type AnimationType = 'fade' | 'slide' | 'slideLeft' | 'slideRight' | 'zoom';
export type AnimationRepeatMode = 'once' | 'loop' | 'times';

export interface BlockElement {
  id: string;
  kind: 'block';
  title: string;
  text?: string; // Main content text
  imageUrl?: string; // Optional image
  headerText?: string; // Optional header
  footerText?: string; // Optional footer
  backgroundColor?: string; // hex color for background
  textColor?: string; // Override default text color
  entryAnimation?: AnimationType; // animation when block enters
  exitAnimation?: AnimationType; // animation when block exits
  enableAutoAdvance?: boolean; // auto-advance to next after delay
  autoAdvanceDelay?: number; // delay in seconds before auto-advance
  showCard?: boolean; // whether to show card styling (default true, false removes card)
}

export type FormElement = Question | BlockElement;

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
  thankYouTemplate?: Partial<ThankYouPage>; // Template for thank you page customization
}

export interface ThankYouButton {
  id: string;
  label: string;
  url: string;
  variant: 'primary' | 'secondary';
}

export interface ThankYouSocialLink {
  platform: 'instagram' | 'twitter' | 'facebook' | 'linkedin' | 'youtube' | 'tiktok';
  url: string;
}

export interface ThankYouPage {
  enabled: boolean;
  title: string;
  subtitle: string;
  backgroundType: 'color' | 'image';
  backgroundColor: string;
  backgroundImage?: string;
  textColor?: string; // Overall text color
  titleColor?: string; // Title-specific color
  subtitleColor?: string; // Subtitle-specific color
  buttons: ThankYouButton[];
  socialLinks: ThankYouSocialLink[];
  showSuccessIcon: boolean;
  showFormInfo: boolean;
  successIconColor?: string; // Icon color
  theme?: string; // Optional theme applied to this page
}

export interface Form {
  id: string;
  user_id?: string; // Owner ID
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
  global_text_color?: string; // Global text color override (database)
  globalTextColor?: string; // Global text color override (camelCase)
  // Support both camelCase and snake_case for compatibility
  backgroundType?: 'color' | 'image';
  backgroundColor?: string;
  backgroundImage?: string;
  theme?: Theme; // Optional theme configuration
  thankYouPage?: ThankYouPage; // Optional custom thank you page configuration
}

export interface FormResponse {
  id: string;
  formId: string;
  timestamp: number;
  answers: Record<string, string | number | boolean | string[]>;
}

export function isBlockElement(element: FormElement): element is BlockElement {
  return (element as BlockElement).kind === 'block';
}

export function isQuestionElement(element: FormElement): element is Question {
  return !isBlockElement(element);
}