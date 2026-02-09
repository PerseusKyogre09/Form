import type { Theme } from './types';

export const DEFAULT_THEME: Theme = {
  id: 'default',
  name: 'Default',
  description: 'Clean and minimal default theme',
  colors: {
    primary: '#1e293b',
    secondary: '#64748b',
    accent: '#3b82f6',
    background: '#ffffff',
    text: '#000000',
  },
};

export const NES_THEME: Theme = {
  id: 'nes',
  name: 'NES.css',
  description: 'Retro 8-bit video game aesthetic',
  cssUrl: 'https://unpkg.com/nes.css@latest/css/nes.min.css',
  fontUrl: 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
  colors: {
    primary: '#000000',
    secondary: '#ffffff',
    accent: '#ff0040',
    background: '#ffffff',
    text: '#000000',
  },
};

export const IDE_DARK_THEME: Theme = {
  id: 'ide-dark',
  name: 'IDE Dark Mode',
  description: 'A dark, code-editor inspired theme with terminal aesthetics',
  fontUrl: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap',
  colors: {
    primary: '#1e1e1e',
    secondary: '#d4d4d4',
    accent: '#14b8a6', // Teal
    background: '#1e1e1e',
    text: '#e0e0e0',
  },
  customCss: `
    /* IDE Dark Mode Theme - Code Editor Inspired */
    
    /* CSS Variables for IDE Dark Mode */
    :root, [data-form-theme] {
      --ide-dark-bg: #1e1e1e;
      --ide-dark-surface: #252526;
      --ide-dark-surface-alt: #2d2d2d;
      --ide-dark-text-primary: #e0e0e0;
      --ide-dark-text-secondary: #a0a0a0;
      --ide-teal-primary: #14b8a6;
      --ide-teal-light: #2dd4bf;
      --ide-orange-primary: #f97316;
      --ide-orange-light: #fb923c;
      --ide-grid-line: rgba(255, 255, 255, 0.05);
    }
    
    /* Background with subtle grid pattern and circuit traces */
    [style*="min-h-screen"] {
      background-color: var(--ide-dark-bg) !important;
      background-image: 
        /* Dot grid pattern */
        radial-gradient(circle, rgba(20, 184, 166, 0.15) 0.5px, transparent 0.5px),
        /* Horizontal grid lines */
        linear-gradient(0deg, transparent 24%, var(--ide-grid-line) 25%, var(--ide-grid-line) 26%, transparent 27%, transparent 74%, var(--ide-grid-line) 75%, var(--ide-grid-line) 76%, transparent 77%, transparent),
        /* Vertical grid lines */
        linear-gradient(90deg, transparent 24%, var(--ide-grid-line) 25%, var(--ide-grid-line) 26%, transparent 27%, transparent 74%, var(--ide-grid-line) 75%, var(--ide-grid-line) 76%, transparent 77%, transparent),
        /* Circuit trace lines - diagonal paths connecting dots */
        linear-gradient(45deg, transparent 48%, rgba(20, 184, 166, 0.08) 49%, rgba(20, 184, 166, 0.08) 51%, transparent 52%),
        linear-gradient(-45deg, transparent 48%, rgba(20, 184, 166, 0.08) 49%, rgba(20, 184, 166, 0.08) 51%, transparent 52%);
      background-size: 
        40px 40px,
        40px 40px,
        40px 40px,
        80px 80px,
        80px 80px;
      background-position:
        0 0,
        0 0,
        0 0,
        0 0,
        0 40px;
      animation: circuitPulse 6s ease-in-out infinite;
      position: relative;
    }
    
    /* Optional: Add glowing animation to circuit lines */
    @keyframes circuitPulse {
      0%, 100% {
        background-color: var(--ide-dark-bg);
      }
      50% {
        background-color: #1f2329;
      }
    }
    
    /* Text colors */
    [style*="color: var(--form-text-primary)"] {
      color:  var(--ide-dark-text-primary) !important;
    }
    
    [style*="color: var(--form-text-secondary)"] {
      color: var(--ide-dark-text-secondary) !important;
    }
    
    /* Input fields with terminal line style */
    input[type="text"],
    input[type="email"],
    input[type="tel"],
    input[type="number"],
    input[type="date"],
    textarea,
    select {
      background-color: transparent !important;
      color: var(--ide-dark-text-primary) !important;
      border-color: var(--ide-dark-surface) !important;
      font-family: 'Inter', system-ui, sans-serif !important;
      font-size: 1.125rem !important;
      letter-spacing: 0.5px;
      transition: all 0.3s ease !important;
    }
    
    input[type="text"]::placeholder,
    input[type="email"]::placeholder,
    input[type="tel"]::placeholder,
    input[type="number"]::placeholder,
    textarea::placeholder {
      color: rgba(224, 224, 224, 0.3) !important;
    }
    
    /* Focused input - glowing teal border */
    input[type="text"]:focus,
    input[type="email"]:focus,
    input[type="tel"]:focus,
    input[type="number"]:focus,
    textarea:focus,
    select:focus {
      border-color: var(--ide-teal-primary) !important;
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1), 0 0 12px rgba(20, 184, 166, 0.3) !important;
      outline: none !important;
    }
    
    /* Validation error - glow in orange */
    input.border-red-400,
    textarea.border-red-400,
    input[class*="border-red"] {
      border-color: var(--ide-orange-primary) !important;
      box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1), 0 0 12px rgba(249, 115, 22, 0.3) !important;
    }
    
    /* Monospace font for headers and labels */
    [class*="text-xs font-bold tracking-wider"],
    [class*="uppercase"] {
      font-family: 'JetBrains Mono', monospace !important;
      font-weight: 700 !important;
      letter-spacing: 0.15em !important;
      color: var(--ide-teal-light) !important;
    }
    
    /* Progress bar styling */
    [class*="progress"] div,
    [style*="width:"] [class*="transition-all"] {
      background: linear-gradient(90deg, var(--ide-teal-primary), var(--ide-teal-light)) !important;
      box-shadow: 0 0 20px rgba(20, 184, 166, 0.5) !important;
    }
    
    /* Progress bar container */
    [class*="h-1"] [class*="transition-all"] {
      background: linear-gradient(90deg, var(--ide-teal-primary), var(--ide-teal-light)) !important;
      box-shadow: 0 0 20px rgba(20, 184, 166, 0.5), inset 0 0 10px rgba(20, 184, 166, 0.2) !important;
    }
    
    /* Buttons - pill shape with glow */
    button {
      font-family: 'JetBrains Mono', monospace !important;
      font-weight: 700 !important;
      letter-spacing: 0.05em !important;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    }
    
    /* Next/Submit button styling */
    button[style*="background: var(--form-button-bg)"],
    button[style*="var(--form-button-bg)"] {
      background: linear-gradient(135deg, var(--ide-teal-primary), var(--ide-teal-light)) !important;
      color: #1e1e1e !important;
      border-radius: 50px !important;
      padding: 1rem 2.5rem !important;
      box-shadow: 0 0 20px rgba(20, 184, 166, 0.3), 0 4px 20px rgba(20, 184, 166, 0.2) !important;
      font-size: 1rem !important;
    }
    
    button[style*="background: var(--form-button-bg)"]:hover:not(:disabled),
    button[style*="var(--form-button-bg)"]:hover:not(:disabled) {
      transform: translateY(-2px) !important;
      box-shadow: 0 0 30px rgba(20, 184, 166, 0.5), 0 8px 30px rgba(20, 184, 166, 0.3) !important;
    }
    
    button[style*="background: var(--form-button-bg)"]:active:not(:disabled),
    button[style*="var(--form-button-bg)"]:active:not(:disabled) {
      transform: translateY(0) !important;
    }
    
    /* Disabled button state */
    button:disabled {
      opacity: 0.5 !important;
      cursor: not-allowed !important;
    }
    
    /* Multiple choice and checkboxes styling */
    label[style*="background: rgba"] {
      background: rgba(37, 37, 38, 0.6) !important;
      border: 2px solid rgba(20, 184, 166, 0.2) !important;
      border-radius: 12px !important;
      transition: all 0.3s ease !important;
      backdrop-filter: blur(10px);
    }
    
    label[style*="background: var(--form-accent)"],
    label[style*="rgba(var(--form-accent-rgb)"] {
      background: rgba(20, 184, 166, 0.15) !important;
      border-color: var(--ide-teal-primary) !important;
      box-shadow: 0 0 15px rgba(20, 184, 166, 0.2) !important;
    }
    
    label[style*="background"]:hover {
      border-color: var(--ide-teal-primary) !important;
      box-shadow: 0 0 15px rgba(20, 184, 166, 0.2) !important;
    }
    
    /* Radio and checkbox styling */
    input[type="radio"],
    input[type="checkbox"] {
      accent-color: var(--ide-teal-primary) !important;
    }
    
    /* Radio button circle */
    [style*="border-2 rounded-full"] {
      border-color: rgba(20, 184, 166, 0.3) !important;
    }
    
    /* Required asterisk in orange */
    .text-red-500,
    [style*="color: red"],
    span:has(+ .text-red-500),
    span:has(.text-red-500) {
      color: var(--ide-orange-primary) !important;
    }
    
    /* Card backgrounds */
    [style*="background: var(--form-card-bg)"],
    [style*="backdrop-blur"] {
      background: rgba(37, 37, 38, 0.8) !important;
      backdrop-filter: blur(10px) !important;
      border-color: rgba(20, 184, 166, 0.1) !important;
    }
    
    /* Dropdown styling */
    select {
      color-scheme: dark !important;
    }
    
    /* Validation error text */
    .text-red-400,
    p[style*="color: var(--form-text-secondary)"],
    [class*="text-sm"] [style*="color"] {
      color: var(--ide-dark-text-secondary) !important;
    }
    
    .flex.items-center.gap-2 .text-red-400 {
      color: var(--ide-orange-primary) !important;
    }
    
    /* Icons */
    i[class*="fas"] {
      opacity: 0.9;
    }
    
    /* Navigation buttons (prev/next arrows) */
    button[aria-label*="Previous"],
    button[aria-label*="Next"] {
      background: rgba(37, 37, 38, 0.9) !important;
      border: 2px solid rgba(20, 184, 166, 0.2) !important;
      color: var(--ide-dark-text-primary) !important;
      transition: all 0.3s ease !important;
    }
    
    button[aria-label*="Previous"]:hover:not(:disabled),
    button[aria-label*="Next"]:hover:not(:disabled) {
      border-color: var(--ide-teal-primary) !important;
      box-shadow: 0 0 12px rgba(20, 184, 166, 0.2) !important;
    }
    
    /* Animation for question transitions */
    @keyframes ideSlideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes ideSlideOut {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(-20px);
      }
    }
    
    @keyframes ideCursorBlink {
      0%, 49% {
        opacity: 1;
      }
      50%, 100% {
        opacity: 0;
      }
    }
    
    /* Blinking cursor animation for placeholder */
    input::placeholder,
    textarea::placeholder {
      animation: ideCursorBlink 1s steps(2) infinite;
    }
    
    /* Mobile navigation bar */
    [class*="md:hidden"] [class*="fixed bottom"] {
      background: rgba(30, 30, 30, 0.95) !important;
      backdrop-filter: blur(20px) !important;
      border-top-color: rgba(20, 184, 166, 0.1) !important;
    }
    
    /* Dark mode for select options */
    option {
      background-color: var(--ide-dark-surface) !important;
      color: var(--ide-dark-text-primary) !important;
    }
    
    /* Loading spinner */
    [class*="animate-spin"] {
      border-color: rgba(20, 184, 166, 0.3) !important;
      border-top-color: var(--ide-teal-primary) !important;
    }
    
    /* Smooth transitions */
    * {
      transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
    }
    
    /* Special styling for question labels */
    h3[style*="color"] {
      font-family: 'JetBrains Mono', monospace !important;
      font-weight: 600 !important;
      letter-spacing: 0.02em !important;
      color: var(--ide-dark-text-primary) !important;
    }
    
    /* Block headers styling */
    h4[style*="color"] {
      font-family: 'JetBrains Mono', monospace !important;
      font-weight: 600 !important;
      letter-spacing: 0.02em !important;
      color: var(--ide-dark-text-primary) !important;
    }
    
    /* Block elements styling - override inline styles */
    [class*="rounded-2xl"][style*="background-color"] {
      background-color: var(--ide-dark-surface) !important;
      border: 1px solid rgba(20, 184, 166, 0.15) !important;
    }
    
    [class*="rounded-2xl"][style*="background-color"] h4,
    [class*="rounded-2xl"][style*="background-color"] p,
    [class*="rounded-2xl"][style*="background-color"] span {
      color: var(--ide-dark-text-primary) !important;
      font-family: 'Inter', system-ui, sans-serif !important;
    }
    
    [class*="rounded-2xl"][style*="background-color"] h4 {
      font-family: 'JetBrains Mono', monospace !important;
      font-weight: 600 !important;
    }
    
    /* Block borders between sections */
    [class*="border-b"],
    [class*="border-t"] {
      border-color: rgba(20, 184, 166, 0.1) !important;
    }
    
    /* Ensure all text in dark mode blocks is visible */
    [style*="background-color: var(--form-card-bg)"] {
      background-color: var(--ide-dark-surface) !important;
      color: var(--ide-dark-text-primary) !important;
    }
    
    [style*="background-color: var(--form-card-bg)"] h4,
    [style*="background-color: var(--form-card-bg)"] h3,
    [style*="background-color: var(--form-card-bg)"] p,
    [style*="background-color: var(--form-card-bg)"] span {
      color: var(--ide-dark-text-primary) !important;
    }
    
    /* Locked form message */
    [class*="text-8xl"] ~ h2 {
      color: var(--ide-dark-text-primary) !important;
    }
  `
};

export const THEMES: Theme[] = [DEFAULT_THEME, NES_THEME, IDE_DARK_THEME];

export function getThemeById(id: string): Theme | undefined {
  return THEMES.find((theme) => theme.id === id);
}

export function applyTheme(theme: Theme): void {
  // Remove any previously injected theme stylesheets
  const previousThemeLinks = document.querySelectorAll('[data-theme-id]');
  previousThemeLinks.forEach((link) => link.remove());

  // Apply external font if available
  if (theme.fontUrl) {
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = theme.fontUrl;
    fontLink.setAttribute('data-theme-id', theme.id);
    document.head.appendChild(fontLink);
  }

  // Apply external CSS if available
  if (theme.cssUrl) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = theme.cssUrl;
    link.setAttribute('data-theme-id', theme.id);
    document.head.appendChild(link);
  }

  // Apply custom CSS if available
  if (theme.customCss) {
    const style = document.createElement('style');
    style.setAttribute('data-theme-id', theme.id);
    style.textContent = theme.customCss;
    document.head.appendChild(style);
  }

  // Store current theme in localStorage
  try {
    localStorage.setItem('selectedTheme', theme.id);
  } catch (e) {
    console.warn('Could not save theme preference:', e);
  }
}

export function loadSavedTheme(): Theme {
  try {
    const savedThemeId = localStorage.getItem('selectedTheme');
    if (savedThemeId) {
      const theme = getThemeById(savedThemeId);
      if (theme) {
        applyTheme(theme);
        return theme;
      }
    }
  } catch (e) {
    console.warn('Could not load saved theme:', e);
  }
  return DEFAULT_THEME;
}
