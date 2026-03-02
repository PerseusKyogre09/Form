// src/lib/stores/theme.ts
import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export type ThemePreference = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'quill-theme-preference';

function getInitialPreference(): ThemePreference {
    if (!browser) return 'light';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored;
    return 'light';
}

export const themePreference = writable<ThemePreference>(getInitialPreference());

let mediaQuery: MediaQueryList | null = null;
let mediaHandler: ((e: MediaQueryListEvent) => void) | null = null;

function resolveEffectiveTheme(pref: ThemePreference): 'light' | 'dark' {
    if (pref === 'auto') {
        if (browser && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }
    return pref;
}

function setDarkClass(isDark: boolean) {
    if (!browser) return;
    const html = document.documentElement;
    if (isDark) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
}

export function applyTheme(pref: ThemePreference) {
    if (!browser) return;

    // Clean up previous media listener
    if (mediaQuery && mediaHandler) {
        mediaQuery.removeEventListener('change', mediaHandler);
        mediaQuery = null;
        mediaHandler = null;
    }

    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, pref);

    const effective = resolveEffectiveTheme(pref);
    setDarkClass(effective === 'dark');

    // If auto, listen for OS changes
    if (pref === 'auto') {
        mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaHandler = (e: MediaQueryListEvent) => {
            setDarkClass(e.matches);
        };
        mediaQuery.addEventListener('change', mediaHandler);
    }
}

// Initialize theme immediately on import (browser only)
if (browser) {
    applyTheme(getInitialPreference());
}
