import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { forms, questions, user as userTable } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';

// Helper to wrap long form titles cleanly onto up to 2 lines
function wrapText(text: string, maxCharsPerLine: number = 28): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  if (lines.length > 2) {
    lines[1] = lines[1].substring(0, maxCharsPerLine - 3) + '...';
    return [lines[0], lines[1]];
  }
  return lines;
}

// Check brightness to match light or dark mode themes
function isDarkColor(hex: string): boolean {
  if (!hex || hex === 'transparent') return false;
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  }
  return false;
}

// Estimate if a color is too bright or close to white to ensure contrast on buttons
function isLightColor(hex: string): boolean {
  if (!hex) return true;
  const cleanHex = hex.replace('#', '');
  let r = 255, g = 255, b = 255;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
}

export async function GET({ params, url }) {
  const username = params.username as string;
  const slug = params.slug as string;

  let formTitle = 'Untitled Form';
  let ownerName = username;
  let numQuestions = 0;
  let isFormClosed = false;

  // Ground canvas elements in Quill's high-end Warm Paper brand style
  let canvasBg = '#f4f1ea';      // --bg-canvas light
  let cardBg = '#ffffff';        // --surface-strong light
  let borderCol = '#d9d3c8';     // --border light
  let textPrimary = '#1f2328';   // --text light
  let textMuted = '#5f6872';     // --text-muted light
  let accentCol = '#4f61ba';     // --accent light
  let btnText = '#ffffff';

  try {
    // 1. Fetch form owner
    const profile = await db.query.user.findFirst({
      where: eq(userTable.username, username),
      columns: { id: true, name: true, username: true }
    });

    if (profile) {
      ownerName = profile.name || profile.username || username;

      // 2. Fetch form details
      const form = await db.query.forms.findFirst({
        where: and(
          eq(forms.user_id, profile.id),
          eq(forms.slug, slug),
          eq(forms.published, true)
        )
      });

      if (form) {
        formTitle = form.title || 'Untitled Form';
        isFormClosed = form.closed || false;

        // Fetch questions count
        const questionsData = await db.select({ id: questions.id })
          .from(questions)
          .where(eq(questions.form_id, form.id));
        numQuestions = questionsData.length;

        // Parse custom themes/backgrounds to match the form exactly
        const formBgColor = form.background_color;
        const isDark = formBgColor ? isDarkColor(formBgColor) : false;

        // Extract custom theme accent color
        const customTheme = form.theme as any;
        if (customTheme?.accentColor) {
          accentCol = customTheme.accentColor;
        }

        // Apply theme-aware ground rules (always clean, soft Warm Paper or Graphite framing)
        if (isDark) {
          canvasBg = '#181713';      // --bg-canvas dark
          cardBg = '#23211c';        // --surface-strong dark
          borderCol = '#38332a';     // --border dark
          textPrimary = '#ece6dc';   // --text dark
          textMuted = '#b7aea2';     // --text-muted dark
          if (!customTheme?.accentColor) accentCol = '#8ea0ff'; // --accent dark fallback
        } else {
          canvasBg = '#f4f1ea';
          cardBg = '#ffffff';
          borderCol = '#d9d3c8';
          textPrimary = '#1f2328';
          textMuted = '#5f6872';
        }

        // Contrast adaptation for primary mock action button
        btnText = isLightColor(accentCol) ? '#181713' : '#ffffff';
      }
    }
  } catch (err) {
    console.error('Error rendering dynamic SVG preview details:', err);
  }

  // Handle title lines cleanly
  const titleLines = wrapText(formTitle, 26);
  const line1 = titleLines[0] || 'Untitled Form';
  const line2 = titleLines[1] || '';

  // Clean status text devoid of emojis
  const statusText = `${numQuestions} questions \u2022 Created by ${ownerName} \u2022 ${isFormClosed ? 'Submission closed' : 'Open for responses'}`;

  // Clean, high-fidelity premium SVG markup
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
      <defs>
        <!-- Fine background grids mimicking premium editor blueprints -->
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${borderCol}" stroke-width="0.5" stroke-opacity="0.6" />
        </pattern>
      </defs>

      <!-- 1. Background Frame -->
      <rect width="1200" height="630" fill="${canvasBg}" />
      <rect width="1200" height="630" fill="url(#grid)" />

      <!-- Outer Frame Edge -->
      <rect x="0" y="0" width="1200" height="630" fill="none" stroke="${borderCol}" stroke-width="2" />

      <!-- 2. Website Branding Header (Highly visible, elegant & crisp) -->
      <g transform="translate(100, 26)">
        <!-- Clean, bold rounded badge matching the theme accent -->
        <rect width="54" height="54" rx="12" fill="${accentCol}" />
        
        <!-- High-fidelity inline Quill feather pen vector using official colors -->
        <g transform="translate(13, 11)">
          <!-- Main feather body in Quill Red -->
          <path d="M19 1 C14 5, 11 12, 14 17 C15 19, 17 21, 20 22 C21 18, 23 11, 27 7 C29 4, 26 1, 22 1 Z" fill="#CD3E3B" />
          <!-- Feather highlights in Quill Ivory -->
          <path d="M19 1 C20 5, 21 12, 23 17 C24 19, 25 20, 27 21 C28 18, 29 12, 29 7 C29 5, 27 3, 24 2 Z" fill="#F3ECD0" fill-opacity="0.85" />
          <!-- Spine/Shaft in Quill Dark Brown -->
          <path d="M16 18 C18 15, 20 9, 21 2" stroke="#3F2B1B" stroke-width="1.8" stroke-linecap="round" fill="none" />
          <!-- Pen Nib/Tip in Quill Dark Brown -->
          <path d="M14 20 L8 26 C7 27, 7 28, 8 29 L9 30 C10 31, 11 31, 12 30 L18 24 Z" fill="#3F2B1B" />
        </g>
      </g>

        <!-- Brand Name & Description (High legibility typography) -->
        <text x="72" y="37" font-family="Inter, system-ui, sans-serif" font-size="28" font-weight="700" fill="${textPrimary}">Quill</text>
        <text x="156" y="34" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="500" fill="${textMuted}">Forms with structure, not noise</text>
      </g>

      <!-- Separator Rule below topbar -->
      <line x1="0" y1="110" x2="1200" y2="110" stroke="${borderCol}" stroke-width="1.5" />

      <!-- 3. Form Central Panel Card -->
      <!-- Shadow backing -->
      <rect x="103" y="183" width="994" height="364" rx="16" fill="#000000" fill-opacity="0.03" />
      
      <!-- Card Container -->
      <rect x="100" y="180" width="994" height="364" rx="14" fill="${cardBg}" stroke="${borderCol}" stroke-width="1.5" />
      
      <!-- Left Edge Highlight Strip (matching form accent) -->
      <rect x="100" y="180" width="10" height="364" rx="3" fill="${accentCol}" />

      <!-- 4. Card Content Details -->
      <!-- Eyebrow text -->
      <text x="160" y="250" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600" fill="${textMuted}" letter-spacing="2" text-transform="uppercase">FORM BY @${username.toUpperCase()}</text>

      <!-- Dynamic Wrapped Form Title -->
      ${line2 ? `
        <text x="160" y="310" font-family="Inter, system-ui, sans-serif" font-size="44" font-weight="700" fill="${textPrimary}">${line1}</text>
        <text x="160" y="365" font-family="Inter, system-ui, sans-serif" font-size="44" font-weight="700" fill="${textPrimary}">${line2}</text>
      ` : `
        <text x="160" y="335" font-family="Inter, system-ui, sans-serif" font-size="46" font-weight="700" fill="${textPrimary}">${line1}</text>
      `}

      <!-- Status Metadata (No Emojis, premium and clean spacing) -->
      <text x="160" y="${line2 ? '415' : '390'}" font-family="Inter, system-ui, sans-serif" font-size="17" font-weight="500" fill="${textMuted}">
        ${statusText}
      </text>

      <!-- Mock Action Call Button (Styled precisely matching your primary buttons) -->
      <g transform="translate(160, 445)">
        <rect width="210" height="52" rx="10" fill="${accentCol}" />
        <text x="105" y="31" font-family="Inter, system-ui, sans-serif" font-size="15" font-weight="600" fill="${btnText}" text-anchor="middle">
          ${isFormClosed ? 'View status' : 'Fill out form'}
        </text>
      </g>

      <!-- 5. Minimalist Premium Form Vector Illustration (Balances visual weight on the right side) -->
      <g transform="translate(830, 250)">
        <!-- Stacked back card shadow layer -->
        <rect x="18" y="-12" width="130" height="170" rx="12" fill="none" stroke="${borderCol}" stroke-width="1.5" transform="rotate(5, 83, 73)" />
        
        <!-- Stacked front card container representing form interface -->
        <rect x="0" y="0" width="130" height="170" rx="12" fill="${cardBg}" stroke="${borderCol}" stroke-width="1.5" />
        
        <!-- Active form header element -->
        <rect x="12" y="12" width="106" height="40" rx="6" fill="${accentCol}" fill-opacity="0.08" />
        <rect x="20" y="22" width="50" height="6" rx="2" fill="${accentCol}" />
        <rect x="20" y="34" width="70" height="4" rx="2" fill="${textMuted}" />

        <!-- Mock form inputs (Deliberate fields structure) -->
        <!-- Field 1 label -->
        <rect x="12" y="66" width="65" height="5" rx="2" fill="${textMuted}" fill-opacity="0.7" />
        <!-- Field 1 text line -->
        <rect x="12" y="78" width="106" height="24" rx="6" fill="none" stroke="${borderCol}" stroke-width="1.5" />
        <line x1="22" y1="84" x2="22" y2="96" stroke="${accentCol}" stroke-width="2" />
        
        <!-- Field 2 label -->
        <rect x="12" y="116" width="45" height="5" rx="2" fill="${textMuted}" fill-opacity="0.7" />
        <!-- Field 2 choice options -->
        <circle cx="17" cy="134" r="5" fill="none" stroke="${borderCol}" stroke-width="1.5" />
        <rect x="28" y="132" width="50" height="4" rx="2" fill="${textMuted}" fill-opacity="0.5" />

        <circle cx="17" cy="150" r="5" fill="${accentCol}" />
        <rect x="28" y="148" width="35" height="4" rx="2" fill="${textPrimary}" />
      </g>
    </svg>
  `;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=604800, immutable'
    }
  });
}
