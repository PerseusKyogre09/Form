<!-- src/routes/form/[formId]/success/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import type { Theme } from '$lib/types';

  let theme: Theme | undefined = undefined;
  let backgroundColor = '#ffffff';
  let textColor = '#1f2937';
  let accentColor = '#4f46e5';

  onMount(async () => {
    try {
      const formId = $page.params.formId as string;
      const { data } = await supabase
        .from('forms')
        .select('theme, background_color, global_text_color')
        .eq('id', formId)
        .single();

      if (data) {
        theme = data.theme;
        backgroundColor = data.background_color || '#ffffff';
        if (theme?.id === 'ide-dark') {
          textColor = '#e0e0e0';
          accentColor = '#14b8a6';
        }
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  });
</script>

<div 
  class="min-h-screen flex items-center justify-center transition-colors duration-200"
  style="background-color: {theme?.id === 'ide-dark' ? '#1a1a1a' : backgroundColor};"
>
  <div class="text-center max-w-md px-6">
    <div class="mb-6">
      <div 
        class="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
        style="background-color: {theme?.id === 'ide-dark' ? 'rgba(20,184,166,0.2)' : 'rgba(34,197,94,0.2)'};"
      >
        <svg 
          class="w-8 h-8" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          style="color: {theme?.id === 'ide-dark' ? '#14b8a6' : '#22c55e'};"
        >
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </div>
      <h1 
        class="text-4xl font-bold mb-2"
        style="color: {theme?.id === 'ide-dark' ? '#e0e0e0' : '#000000'};"
      >
        Thank You!
      </h1>
      <p 
        class="text-lg mb-6"
        style="color: {theme?.id === 'ide-dark' ? '#a0a0a0' : '#4b5563'};"
      >
        Your response has been recorded successfully.
      </p>
    </div>

    <div class="space-y-4">
      <p 
        class="text-sm mb-6"
        style="color: {theme?.id === 'ide-dark' ? '#808080' : '#6b7280'};"
      >
        Form: <span 
          class="font-mono"
          style="color: {theme?.id === 'ide-dark' ? '#b0b0b0' : '#374151'};"
        >{$page.params.formId}</span>
      </p>
      
      <a 
        href="/" 
        class="block px-6 py-3 rounded-md font-medium transition-colors text-white"
        style="background-color: {theme?.id === 'ide-dark' ? '#14b8a6' : '#000000'}; {theme?.id === 'ide-dark' ? 'background-color: #14b8a6;' : ''}"
      >
        Create Another Form
      </a>
      
      <a 
        href="/" 
        class="block px-6 py-3 rounded-md font-medium transition-colors"
        style="background-color: {theme?.id === 'ide-dark' ? 'rgba(20,184,166,0.1)' : '#f3f4f6'}; color: {theme?.id === 'ide-dark' ? '#e0e0e0' : '#000000'};"
      >
        Back to Home
      </a>
    </div>
  </div>
</div>

