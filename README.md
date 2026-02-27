# Quill

A modern, feature-rich form builder application inspired by Typeform. Create sophisticated forms with smooth animations, real-time collaboration, and powerful customization options.

## About

Quill is a full-stack form creation platform that allows users to build beautiful, interactive forms without coding. Built with modern web technologies, it features:

- **Intuitive Form Builder** - Drag-and-drop interface for creating forms with multiple question types
- **Rich Customization** - Theme support with custom colors, fonts, and backgrounds
- **Smooth Animations** - GSAP-powered transitions for an engaging user experience
- **Real-time Preview** - Live preview of your forms as you design them
- **Team Collaboration** - Share and collaborate on forms with team members
- **Response Management** - Collect, view, and analyze form responses
- **Thank You Pages** - Customize post-submission experiences
- **Form Sharing** - Generate shareable links with customizable URLs and closed form states

## Tech Stack

- **Frontend**: SvelteKit, TypeScript, Tailwind CSS
- **Animations**: GSAP
- **Backend**: Cloudflare Workers, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Styling**: Tailwind CSS with PostCSS

## Deployment

Quill is deployed on **Cloudflare Workers** with a **Supabase** backend:

1. **Frontend & API**: Deployed as a Cloudflare Workers application
   - Built with SvelteKit adapter for Cloudflare
   - Auto-deployed on git push to production branch
   - Global CDN distribution via Cloudflare

2. **Database**: PostgreSQL hosted on Supabase
   - Used for storing forms, responses, user data, and collaborations
   - RLS (Row Level Security) policies for multi-tenant data protection
   - Real-time subscriptions support

3. **Deployment Steps**:
   ```sh
   npm run build
   wrangler publish  # Deploy to Cloudflare Workers
   ```

## Getting Started

1. Install dependencies:
   ```sh
   npm install
   ```

2. Start the development server:
   ```sh
   npm run dev -- --open
   ```

3. Open your browser to `http://localhost:5173`

## Usage

- Use the Form Builder to add questions and customize your form
- Click "Preview Form" to see how it looks with animations
- Share your form using the sharing modal
- View and manage responses from the dashboard
- Collaborate with team members on form creation

## Building for Production

```sh
npm run build
```

Preview the build:
```sh
npm run preview
```

## Team

This project was built by:

- **Pradeepto Pal** - RA2411003030104
- **Arush Anand Singh** - RA2411003030097
- **Abhinav Chauhan** - RA2411003030093
## Troubleshooting

- If animations don't work, ensure GSAP is installed: `npm install gsap`
- Check Supabase connection in environment variables for database issues
- Ensure Cloudflare Workers credentials are configured for deployment
