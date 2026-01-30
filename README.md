# Form Builder App

A Typeform-like form creation app built with SvelteKit, featuring smooth animations powered by GSAP.

## Features

- Create custom forms with multiple question types: text, multiple choice, yes/no, rating
- Live preview with animated transitions
- Save and load forms using localStorage
- Responsive design

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
- Save your form to localStorage
- Load saved forms from the list

## Building for Production

```sh
npm run build
```

Preview the build:
```sh
npm run preview
```

## Troubleshooting

- If animations don't work, ensure GSAP is installed: `npm install gsap`
- Forms are saved in browser localStorage; clear storage if needed
