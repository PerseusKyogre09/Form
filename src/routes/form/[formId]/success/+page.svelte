<!-- src/routes/form/[formId]/success/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="min-h-screen bg-white flex items-center justify-center">
  <div class="text-center max-w-md">
    <div class="mb-6">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
        <svg class="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </div>
      <h1 class="text-4xl font-bold text-black mb-2">Thank You!</h1>
      <p class="text-gray-600 text-lg mb-6">Your response has been recorded successfully.</p>
    </div>

    <div class="space-y-4">
      <p class="text-sm text-gray-500 mb-6">
        Form ID: <span class="font-mono text-gray-700">{$page.params.formId}</span>
      </p>
      
      <a href="/" class="block px-6 py-3 bg-black text-white rounded-md font-medium hover:bg-gray-900 transition-colors">
        Create Another Form
      </a>
      
      <a href="/" class="block px-6 py-3 bg-gray-100 text-black rounded-md font-medium hover:bg-gray-200 transition-colors">
        Back to Home
      </a>
    </div>
  </div>
</div>
