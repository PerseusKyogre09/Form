// src/lib/utils/colorExtractor.ts
// Utility for extracting dominant colors from images and generating contrast palettes with vibrant colors

export interface ColorPalette {
    textPrimary: string;
    textPrimaryRGB: string;
    textSecondary: string;
    cardBackground: string;
    cardBackgroundSolid: string;
    accent: string;
    accentRGB: string;
    accentText: string;
    buttonBackground: string;
    buttonText: string;
    isDark: boolean;
}

interface RGB {
    r: number;
    g: number;
    b: number;
}

interface HSL {
    h: number; // 0-360
    s: number; // 0-1
    l: number; // 0-1
}

/**
 * Extract dominant colors from an image URL
 * Returns an array of hex colors sorted by frequency
 */
export async function extractDominantColors(imageUrl: string, numColors: number = 5): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    resolve(['#4338ca']); // Fallback
                    return;
                }

                const sampleSize = 50;
                canvas.width = sampleSize;
                canvas.height = sampleSize;

                ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

                const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
                const pixels: RGB[] = [];

                for (let i = 0; i < imageData.data.length; i += 4) { // Sample every pixel in the low-res canvas
                    const r = imageData.data[i];
                    const g = imageData.data[i + 1];
                    const b = imageData.data[i + 2];
                    const a = imageData.data[i + 3];

                    if (a < 128) continue;
                    pixels.push({ r, g, b });
                }

                const colors = quantizeColors(pixels, numColors);
                resolve(colors);
            } catch (error) {
                console.warn('Color extraction failed:', error);
                resolve(['#4338ca']);
            }
        };

        img.onerror = () => {
            console.warn('Failed to load image for color extraction');
            resolve(['#4338ca']);
        };

        img.src = imageUrl;
    });
}

function quantizeColors(pixels: RGB[], numColors: number): string[] {
    const buckets: Map<string, { count: number; avgR: number; avgG: number; avgB: number }> = new Map();

    // Use larger buckets (divide by 24) to group slightly different colors better
    const precision = 24;

    for (const pixel of pixels) {
        const bucketKey = `${Math.floor(pixel.r / precision)}-${Math.floor(pixel.g / precision)}-${Math.floor(pixel.b / precision)}`;

        if (buckets.has(bucketKey)) {
            const bucket = buckets.get(bucketKey)!;
            bucket.avgR += pixel.r;
            bucket.avgG += pixel.g;
            bucket.avgB += pixel.b;
            bucket.count++;
        } else {
            buckets.set(bucketKey, {
                count: 1,
                avgR: pixel.r,
                avgG: pixel.g,
                avgB: pixel.b
            });
        }
    }

    const sorted = Array.from(buckets.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, numColors * 2); // Get more candidates initially

    return sorted.map(bucket =>
        rgbToHex(
            Math.round(bucket.avgR / bucket.count),
            Math.round(bucket.avgG / bucket.count),
            Math.round(bucket.avgB / bucket.count)
        )
    );
}

export function calculateLuminance(hexColor: string): number {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return 0.5;

    const transform = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };

    return 0.2126 * transform(rgb.r) + 0.7152 * transform(rgb.g) + 0.0722 * transform(rgb.b);
}

export function calculateContrastRatio(color1: string, color2: string): number {
    const lum1 = calculateLuminance(color1);
    const lum2 = calculateLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Generate a complete contrast palette based on dominant background colors
 */
export function generateContrastPalette(dominantColors: string[]): ColorPalette {
    if (dominantColors.length === 0) return getDefaultPalette();

    const primaryBgColor = dominantColors[0];
    const luminance = calculateLuminance(primaryBgColor);

    // Determine card background (Glassmorphism usually benefits from white/black transparency)
    // But we can tint it slightly with the primary color
    const isDark = luminance < 0.6;

    // Find the most vibrant color for the accent
    // If no vibrant color is found, use the primary background color but adjusted
    let accentColor = findVibrantColor(dominantColors) || primaryBgColor;

    // Ensure accent is visible against the card background
    const cardBase = isDark ? '#1e1e2e' : '#ffffff';
    accentColor = ensureContrastHSL(accentColor, cardBase, 3.0); // AA Large Text requirement roughly

    // --- TEXT COLOR GENERATION ---
    // Instead of defaulting to white/black, we take the ACCENT color (or primary)
    // and shift its Lightness/Saturation to become a readable text color.

    // 1. Base Text Color: Start with the vibrant accent to keep the "vibe"
    // 2. Adjust it to pass WCAG AAA (7:1) against the card background
    // 3. Force minimum saturation so it doesn't look gray
    let textPrimary = getVibrantReadableColor(accentColor, cardBase, 7.0);

    const textRgb = hexToRgb(textPrimary) || { r: 0, g: 0, b: 0 };
    const accentRgb = hexToRgb(accentColor) || { r: 0, g: 0, b: 0 };

    // Secondary text: less opaque version of primary, or slightly desaturated
    const textSecondary = `rgba(${textRgb.r}, ${textRgb.g}, ${textRgb.b}, 0.75)`;

    // Button Text: needs to contrast against the Accent Color
    // Try to use the Card Base (White/Black) as it's usually cleanest, 
    // BUT we can tint it slightly with the primary color for premium feel.
    const buttonText = getVibrantReadableColor(primaryBgColor, accentColor, 4.5);

    // Card Background
    // If dark, use a very dark version of primary color. If light, use very light version.
    let cardBgSolid = isDark
        ? adjustHsl(primaryBgColor, { l: 0.1, s: 0.2 }) // Dark, desaturated tint
        : adjustHsl(primaryBgColor, { l: 0.98, s: 0.1 }); // Light, desaturated tint

    // For the glass effect, we use standard black/white with opacity roughly
    const cardBgGlass = isDark ? 'rgba(20, 20, 30, 0.6)' : 'rgba(255, 255, 255, 0.85)';

    return {
        textPrimary,
        textPrimaryRGB: `${textRgb.r}, ${textRgb.g}, ${textRgb.b}`,
        textSecondary,
        cardBackground: cardBgGlass,
        cardBackgroundSolid: cardBgSolid,
        accent: accentColor,
        accentRGB: `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`,
        accentText: buttonText,
        buttonBackground: accentColor,
        buttonText: buttonText,
        isDark
    };
}

/**
 * Smart function to transform a source color into a readable text color
 * while preserving its Hue and keeping it properly Saturated.
 */
function getVibrantReadableColor(sourceColor: string, bgColor: string, minRatio: number): string {
    const bgLum = calculateLuminance(bgColor);
    const isBgDark = bgLum < 0.5;

    // Convert source to HSL
    let hsl = rgbToHsl(hexToRgb(sourceColor)!);

    // Initial loop: Adjust Lightness to meet contrast
    // We also boost saturation for dark backgrounds to ensure it looks "colored" and not pastel white
    // For light backgrounds, we darken it, so saturation usually holds up well.

    let bestHsl = { ...hsl };
    let bestRatio = 0;

    // Search direction: if background is dark, we go L: 50% -> 95%
    // If background is light, we go L: 50% -> 5%
    const step = isBgDark ? 0.05 : -0.05;
    let currentL = isBgDark ? 0.5 : 0.5;

    // Optimization: start loop from current lightness if it's already in the right "half"
    if (isBgDark && hsl.l > 0.5) currentL = hsl.l;
    if (!isBgDark && hsl.l < 0.5) currentL = hsl.l;

    for (let i = 0; i < 20; i++) {
        // Enforce minimum saturation for vibrancy (unless original was grayscale)
        // If original S was < 0.1, it's gray, keep it gray.
        // Otherwise, assume user wants color. Minimum 0.4 for dark mode text (neon effect), 0.6 for light mode.
        const minSat = hsl.s < 0.1 ? hsl.s : (isBgDark ? 0.6 : 0.8);
        const adjustedS = Math.max(hsl.s, minSat);

        const candidateHex = hslToHex(hsl.h, adjustedS, currentL);
        const ratio = calculateContrastRatio(candidateHex, bgColor);

        if (ratio >= minRatio) {
            return candidateHex;
        }

        if (ratio > bestRatio) {
            bestRatio = ratio;
            bestHsl = { h: hsl.h, s: adjustedS, l: currentL };
        }

        currentL += step;

        // Clamp
        if (currentL > 0.98 || currentL < 0.02) break;
    }

    // If we failed to find strict contrast, return best effort or fallback
    if (bestRatio < 3.0) {
        return isBgDark ? '#ffffff' : '#000000';
    }

    return hslToHex(bestHsl.h, bestHsl.s, bestHsl.l);
}

function ensureContrastHSL(color: string, bg: string, ratio: number): string {
    return getVibrantReadableColor(color, bg, ratio);
}

/**
 * Returns the most vibrant color (highest saturation) that isn't extremely dark/light
 */
function findVibrantColor(colors: string[]): string | null {
    let maxScore = 0;
    let bestColor: string | null = null;

    for (const color of colors) {
        const rgb = hexToRgb(color);
        if (!rgb) continue;
        const hsl = rgbToHsl(rgb);

        // Reject nearly grayscale colors for accent detection
        if (hsl.s < 0.2) continue;

        // Score based on saturation. Penalize very dark/light colors.
        // We want colors in the middle lightness range (0.3 - 0.8)
        let score = hsl.s;

        if (hsl.l < 0.2 || hsl.l > 0.85) score *= 0.5; // Penalty

        // Bonus for non-blue colors (since default fallback is blue, and many UIs overuse blue)
        // Hue 200-260 is blueish. 
        if (hsl.h < 200 || hsl.h > 260) score *= 1.2;

        if (score > maxScore) {
            maxScore = score;
            bestColor = color;
        }
    }

    return bestColor;
}

// --- HSL UTILITIES ---

function adjustHsl(hex: string, overrides: { h?: number, s?: number, l?: number }): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const hsl = rgbToHsl(rgb);
    const h = overrides.h ?? hsl.h;
    const s = overrides.s ?? hsl.s;
    const l = overrides.l ?? hsl.l;
    return hslToHex(h, s, l);
}

function rgbToHsl({ r, g, b }: RGB): HSL {
    r /= 255; g /= 255; b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h: h * 360, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h / 360 + 1 / 3);
        g = hue2rgb(p, q, h / 360);
        b = hue2rgb(p, q, h / 360 - 1 / 3);
    }

    return rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}

function hexToRgb(hex: string): RGB | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
        const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function getDefaultPalette(): ColorPalette {
    return {
        textPrimary: '#1e293b',
        textPrimaryRGB: '30, 41, 59',
        textSecondary: '#64748b',
        cardBackground: 'rgba(255, 255, 255, 0.95)',
        cardBackgroundSolid: '#ffffff',
        accent: '#8b5cf6',
        accentRGB: '139, 92, 246',
        accentText: '#ffffff',
        buttonBackground: '#8b5cf6',
        buttonText: '#ffffff',
        isDark: false
    };
}

export async function preloadAndExtractColors(
    imageUrl: string
): Promise<{ palette: ColorPalette; ready: boolean }> {
    try {
        const dominantColors = await extractDominantColors(imageUrl);
        const palette = generateContrastPalette(dominantColors);
        return { palette, ready: true };
    } catch (error) {
        return { palette: getDefaultPalette(), ready: true };
    }
}
