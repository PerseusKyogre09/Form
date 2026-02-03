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

export const THEMES: Theme[] = [DEFAULT_THEME, NES_THEME];

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
