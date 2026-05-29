import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { forms, questions, user as userTable } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';

// Helper to wrap long form titles cleanly onto up to 2 lines
function wrapText(text: string, maxCharsPerLine: number = 32): string[] {
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

  // Limit to maximum of 2 lines for aesthetic balance inside the preview card
  if (lines.length > 2) {
    lines[1] = lines[1].substring(0, maxCharsPerLine - 3) + '...';
    return [lines[0], lines[1]];
  }
  return lines;
}

// Simple brightness estimator to adapt the card styles dynamically
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

export async function GET({ params }) {
  const username = params.username as string;
  const slug = params.slug as string;

  let formTitle = 'Quill Form';
  let ownerName = username;
  let numQuestions = 0;
  let isFormClosed = false;

  // Default design system colors (Quill Warm Paper Theme)
  let canvasBg = '#f4f1ea';      // --bg-canvas
  let cardBg = '#ffffff';        // --surface-strong
  let borderCol = '#d9d3c8';     // --border
  let textPrimary = '#1f2328';   // --text
  let textMuted = '#5f6872';     // --text-muted
  let accentCol = '#4f61ba';     // --accent
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

        // Extract accent from theme preference if present
        const customTheme = form.theme as any;
        if (customTheme?.accentColor) {
          accentCol = customTheme.accentColor;
        }

        // If the form has a custom color, let's personalized the preview!
        if (formBgColor) {
          canvasBg = formBgColor;
          if (isDark) {
            // Apply Quill Dark Sepia variables
            cardBg = '#1f1d19';       // --surface
            borderCol = '#38332a';    // --border
            textPrimary = '#ece6dc';  // --text
            textMuted = '#b7aea2';    // --text-muted
            if (!customTheme?.accentColor) accentCol = '#8ea0ff'; // --accent dark fallback
            btnText = '#181713';
          } else {
            // Light custom background variables
            cardBg = '#ffffff';
            borderCol = '#d9d3c8';
            textPrimary = '#1f2328';
            textMuted = '#5f6872';
            btnText = '#ffffff';
          }
        }
      }
    }
  } catch (err) {
    console.error('Error generating dynamic preview image data:', err);
    // Keep standard fallback values so crawler requests never crash
  }

  // Handle title lines safely using our wrapping engine
  const titleLines = wrapText(formTitle, 28);
  const line1 = titleLines[0] || 'Untitled Form';
  const line2 = titleLines[1] || '';

  // Construct a visually pristine, lightweight, perfectly styled SVG image
  // mimicking the exact typography, card outlines, header bar, and buttons of Quill.
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
      <defs>
        <!-- Dynamic Canvas Decorative Subtle Grid (Quill style structure) -->
        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="${borderCol}" stroke-width="0.3" stroke-opacity="0.6" />
        </pattern>
      </defs>

      <!-- 1. Background Canvas -->
      <rect width="1200" height="630" fill="${canvasBg}" />
      <rect width="1200" height="630" fill="url(#grid)" />

      <!-- 2. Decorative Canvas Border (Mimicking browser screen wrapper) -->
      <rect x="0" y="0" width="1200" height="630" fill="none" stroke="${borderCol}" stroke-width="2" />

      <!-- 3. Top Branding Header Bar (Matches Quill topbar exactly) -->
      <!-- Top separator line -->
      <line x1="0" y1="90" x2="1200" y2="90" stroke="${borderCol}" stroke-width="1.5" />
      
      <!-- Quill Branded Badge (Left side of topbar) -->
      <g transform="translate(100, 31)">
        <!-- Rounded square favicon backing matching accent color -->
        <rect width="28" height="28" rx="8" fill="${accentCol}" />
        
        <!-- Elegant minimalist white Quill feather icon path -->
        <path d="M 9 19 L 9 17 C 9 14.5 10 12.5 12 11 C 13.5 10 15 9.5 16.5 7 L 17 6 C 16 7.5 14.5 8 13.5 8.5 C 11.5 9.5 10.5 11 9.5 13 L 9.5 15 C 8.5 15 7.5 15.5 7 16 Z" fill="#ffffff" />
        <path d="M 8 20 C 8.5 18 10 16 11 15" stroke="#ffffff" stroke-width="1" stroke-linecap="round" />

        <!-- Logo typography styled precisely like Inter font -->
        <text x="40" y="21" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="600" fill="${textPrimary}">Quill</text>
        <text x="95" y="20" font-family="Inter, system-ui, sans-serif" font-size="14" fill="${textMuted}">Forms with structure, not noise</text>
      </g>

      <!-- 4. Main Form Card Container (Mimics .surface .panel-section exactly) -->
      <!-- Subtle shadow box representation -->
      <rect x="153" y="163" width="894" height="364" rx="14" fill="#000000" fill-opacity="0.02" />
      
      <!-- Card Border & Core surface -->
      <rect x="150" y="160" width="894" height="364" rx="12" fill="${cardBg}" stroke="${borderCol}" stroke-width="1.5" />
      
      <!-- Form Accent Color Left Highlight Strip (Signifying active state) -->
      <rect x="150" y="160" width="8" height="364" rx="2" fill="${accentCol}" />

      <!-- 5. Card Content Block -->
      <!-- Eyebrow Tag: Form by author -->
      <text x="210" y="225" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="600" fill="${textMuted}" letter-spacing="2" text-transform="uppercase">FORM BY @${username.toUpperCase()}</text>

      <!-- Form Title Block (Wraps to 2 lines cleanly if long) -->
      ${line2 ? `
        <text x="210" y="280" font-family="Inter, system-ui, sans-serif" font-size="42" font-weight="700" fill="${textPrimary}">${line1}</text>
        <text x="210" y="335" font-family="Inter, system-ui, sans-serif" font-size="42" font-weight="700" fill="${textPrimary}">${line2}</text>
      ` : `
        <text x="210" y="300" font-family="Inter, system-ui, sans-serif" font-size="44" font-weight="700" fill="${textPrimary}">${line1}</text>
      `}

      <!-- Form Details & Status Indicators -->
      <g transform="translate(210, ${line2 ? '375' : '355'})">
        <!-- Submissions Details -->
        <text x="0" y="20" font-family="Inter, system-ui, sans-serif" font-size="16" fill="${textMuted}">
          📝 Contains ${numQuestions} questions • Created by ${ownerName} • ${isFormClosed ? 'Submission closed' : 'Open for responses'}
        </text>
      </g>

      <!-- 6. Mock Interactive Button (Styled exactly like btn-primary) -->
      <g transform="translate(210, 425)">
        <rect width="210" height="46" rx="10" fill="${textPrimary}" />
        <text x="105" y="28" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600" fill="${cardBg}" text-anchor="middle">
          ${isFormClosed ? 'View status' : 'Fill out form'}
        </text>
      </g>
      
      <!-- Subtle checklist graphics on right side (aesthetic visual weight balance, no fancy glows) -->
      <g transform="translate(840, 240)" opacity="0.8">
        <!-- Clipboard backing -->
        <rect x="0" y="0" width="100" height="130" rx="10" fill="none" stroke="${borderCol}" stroke-width="2" />
        <rect x="35" y="-10" width="30" height="16" rx="4" fill="${accentCol}" />
        
        <!-- Checklist items -->
        <line x1="20" y1="30" x2="80" y2="30" stroke="${borderCol}" stroke-width="2" stroke-linecap="round" />
        <line x1="20" y1="55" x2="65" y2="55" stroke="${borderCol}" stroke-width="2" stroke-linecap="round" />
        <line x1="20" y1="80" x2="75" y2="80" stroke="${borderCol}" stroke-width="2" stroke-linecap="round" />
        <line x1="20" y1="105" x2="50" y2="105" stroke="${borderCol}" stroke-width="2" stroke-linecap="round" />
        
        <!-- Checklist checks -->
        <circle cx="20" cy="30" r="4" fill="${accentCol}" />
        <circle cx="20" cy="55" r="4" fill="${accentCol}" />
        <circle cx="20" cy="80" r="4" fill="${accentCol}" />
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
