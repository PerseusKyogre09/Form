# Quill - Publishable Version

A minimalist, high-performance form builder built with SvelteKit that lets you create beautiful forms and collect responses locally.

## Features

✨ **Lightweight & Fast** - Built with Svelte for optimal performance
📝 **Multiple Question Types** - Text, Multiple Choice, Yes/No, Rating (1-5 stars)
✅ **Required Questions** - Mark questions as mandatory to ensure complete responses
🎯 **Smooth Animations** - Elegant transitions powered by GSAP
💾 **Local Storage** - Forms are saved in your browser's localStorage
📊 **Response Tracking** - Responses are saved in a local `responses/` directory
🔄 **Drag to Reorder** - Easily reorder questions by dragging
✓ **Input Validation** - Required questions cannot be skipped

## Getting Started

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

### Building for Production

```bash
npm run build
npm run preview
```

## How to Use

### Creating a Form

1. Click the **Edit** tab
2. Enter your form title
3. Add questions using the buttons (Text, Multiple Choice, Yes/No, Rating)
4. Check the **Required** checkbox for mandatory questions
5. Reorder questions by dragging the grip handle (⋮⋮)
6. Click **Save Form** to store it locally

### Previewing a Form

1. Click the **Preview** tab
2. Test filling out the form
3. Required questions cannot be skipped - try to advance without answering them to see validation
4. Submit the form to save the response

### Viewing Responses

1. Click the **Responses** tab
2. All submitted responses will appear with timestamps
3. Each response shows all answers organized by question
4. Responses are stored in the `responses/` directory with one JSON file per form

## Response Storage

Responses are saved as JSON files in the `responses/` directory:
- Each form gets its own file: `responses/{formId}.json`
- Each response contains:
  - Unique ID
  - Timestamp
  - Form ID
  - All answers (keyed by question ID)

Example response file structure:
```json
[
  {
    "id": "abc123def",
    "formId": "form-001",
    "timestamp": 1675123456789,
    "answers": {
      "q-1": "User's text answer",
      "q-2": "Selected option",
      "q-3": "Yes",
      "q-4": 5
    }
  }
]
```

## Sharing Your Form

To let others fill out your form:

1. **For local testing**: Share the URL with others on your local network
2. **For production**: Deploy the app and share the form preview link
3. Forms are identified by their unique ID in responses

## Technology Stack

- **SvelteKit** - Full-stack framework with TypeScript
- **Tailwind CSS** - Utility-first CSS framework
- **GSAP** - Professional animation library
- **Svelte Stores** - State management with localStorage persistence
- **Node.js File System** - Server-side response storage

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte          # Main app shell with tabs
│   └── api/
│       └── responses/
│           └── +server.ts    # API endpoint for saving/reading responses
├── lib/
│   ├── components/
│   │   ├── FormBuilder.svelte     # Form editing interface
│   │   ├── FormPreview.svelte     # Form filling interface
│   │   ├── QuestionEditor.svelte  # Individual question editor
│   │   └── ResponseViewer.svelte  # Response viewer dashboard
│   ├── stores.ts              # Svelte stores for forms
│   └── types.ts               # TypeScript interfaces
└── app.css                    # Global styles
```

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Notes for Deployment

- Responses are stored on the server's file system in the `responses/` directory
- Ensure the application has write permissions to create and modify this directory
- For production deployments, consider:
  - Backing up the `responses/` directory regularly
  - Setting up proper access controls
  - Implementing authentication if needed
  - Using a database instead of file storage for scalability

## License

MIT
