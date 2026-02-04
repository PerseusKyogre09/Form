// src/lib/utils/textFormatter.ts

/**
 * Parses markdown-like formatting in text and converts to HTML
 * Supports:
 * - _text_ for italic
 * - *text* for bold
 * - __text__ for underline
 * - ~text~ for strikethrough
 * - {color:text} for colored text
 */
export function formatText(text: string, accentColor: string = 'indigo-600'): string {
    if (!text) return '';

    let formatted = text;

    // Order matters! Process longer patterns first to avoid conflicts

    // Underline: __text__ -> <u>text</u> (MUST come before italic)
    formatted = formatted.replace(/__([^_]+)__/g, '<u class="underline decoration-2 underline-offset-2">$1</u>');

    // Bold: *text* -> <strong>text</strong>
    // Allow inheritance of parent color (which might be custom textColor)
    formatted = formatted.replace(/\*([^*]+)\*/g, '<strong class="font-bold">$1</strong>');

    // Italic: _text_ -> <em>text</em>
    formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Strikethrough: ~text~ -> <s>text</s>
    // Use a slightly more visible opacity than 60
    formatted = formatted.replace(/~([^~]+)~/g, '<s class="line-through decoration-current opacity-80">$1</s>');

    // Color highlighting: {color:text} -> <span class="text-color">text</span>
    formatted = formatted.replace(/\{([^:}]+):([^}]+)\}/g, (match, color, content) => {
        if (color === 'accent') {
            return `<span style="color: var(--form-accent)" class="font-medium">${content}</span>`;
        }
        return `<span class="text-${color}-600 font-medium">${content}</span>`;
    });

    // Auto-apply accent color to italics AND keep them italic
    // Prioritize specific accentColor if provided (and not the default 'indigo-600'), otherwise use theme accent
    const colorStyle = (accentColor && accentColor !== 'indigo-600') ? accentColor : 'var(--form-accent)';
    formatted = formatted.replace(/<em>([^<]+)<\/em>/g, `<em class="italic font-bold" style="color: ${colorStyle}">$1</em>`);

    return formatted;
}

/**
 * Strips all formatting and returns plain text
 */
export function stripFormatting(text: string): string {
    if (!text) return '';

    return text
        .replace(/__([^_]+)__/g, '$1')  // underline first
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')    // italic second
        .replace(/~([^~]+)~/g, '$1')
        .replace(/\{[^:}]+:([^}]+)\}/g, '$1');
}

/**
 * Gets the appropriate Tailwind text size class
 */
export function getTextSizeClass(size: string = 'xl'): string {
    const sizeMap: Record<string, string> = {
        'sm': 'text-xs md:text-sm',
        'base': 'text-sm md:text-base',
        'lg': 'text-base md:text-lg',
        'xl': 'text-base md:text-xl',
        '2xl': 'text-lg md:text-2xl',
        '3xl': 'text-xl md:text-3xl',
        '4xl': 'text-2xl md:text-4xl',
    };

    return sizeMap[size] || sizeMap['xl'];
}

/**
 * Gets the appropriate font family class
 */
export function getFontFamilyClass(family: string = 'serif'): string {
    const familyMap: Record<string, string> = {
        'serif': 'font-serif',
        'sans': 'font-sans',
        'mono': 'font-mono',
    };

    return familyMap[family] || familyMap['serif'];
}

/**
 * Gets the appropriate text alignment class
 */
export function getTextAlignClass(align: string = 'left'): string {
    const alignMap: Record<string, string> = {
        'left': 'text-left',
        'center': 'text-center',
        'right': 'text-right',
    };

    return alignMap[align] || alignMap['left'];
}
