<!-- src/lib/components/TemplateGallery.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { FormTemplate } from '../types';
  import { FORM_TEMPLATES, TEMPLATE_CATEGORIES } from '../templates';

  interface Props {
    onSelect: (template: FormTemplate) => void;
    onCancel?: () => void;
  }

  let { onSelect, onCancel }: Props = $props();

  let selectedCategory = $state<string>('all');
  let filteredTemplates = $state<FormTemplate[]>([]);
  let previewTemplate = $state<FormTemplate | null>(null);

  onMount(() => {
    updateFiltered();
  });

  function updateFiltered() {
    if (selectedCategory === 'all') {
      filteredTemplates = FORM_TEMPLATES;
    } else {
      filteredTemplates = FORM_TEMPLATES.filter(t => t.category === selectedCategory);
    }
  }

  function handleCategoryChange(category: string) {
    selectedCategory = category;
    updateFiltered();
  }

  function handleSelectTemplate(template: FormTemplate) {
    onSelect(template);
  }
</script>

<div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
    <!-- Header -->
    <div class="border-b border-gray-200 dark:border-gray-800 p-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Choose a Template</h2>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Start with a pre-built template or create from scratch</p>
        </div>
        <button
          onclick={onCancel}
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Categories -->
    <div class="border-b border-gray-200 dark:border-gray-800 px-6 py-4 overflow-x-auto">
      <div class="flex gap-2">
        {#each TEMPLATE_CATEGORIES as category}
          <button
            onclick={() => handleCategoryChange(category.id)}
            class="px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all flex items-center gap-2 {
              selectedCategory === category.id
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }"
          >
            <i class="fas {category.icon} w-4"></i>
            {category.name}
          </button>
        {/each}
      </div>
    </div>

    <!-- Template Grid -->
    <div class="flex-1 overflow-y-auto p-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Blank Form Option -->
        <button
          onclick={() => onSelect({} as FormTemplate)}
          class="group p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-center"
        >
          <div class="flex justify-center mb-3">
            <i class="fas fa-file-lines text-4xl text-gray-400 group-hover:text-indigo-500 transition-colors"></i>
          </div>
          <h3 class="font-bold text-gray-900 dark:text-white">Blank Form</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Start from scratch</p>
        </button>

        <!-- Template Cards -->
        {#each filteredTemplates as template}
          <button
            onclick={() => handleSelectTemplate(template)}
            class="group p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-lg dark:hover:shadow-indigo-900/30 transition-all text-left overflow-hidden"
            style="background: linear-gradient(135deg, {template.background_color} 0%, {template.background_color}dd 100%)"
          >
            <div class="flex items-start justify-between mb-3">
              <i class="fas {template.icon} text-2xl text-gray-700 dark:text-gray-600"></i>
              <span class="text-xs font-bold px-2 py-1 bg-white/80 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full">
                {template.preview_text}
              </span>
            </div>
            <h3 class="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {template.name}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {template.description}
            </p>
            <div
              onclick={(e) => {
                e.stopPropagation();
                previewTemplate = template;
              }}
              role="button"
              tabindex="0"
              class="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline cursor-pointer"
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  previewTemplate = template;
                }
              }}
            >
              Preview →
            </div>
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>

<!-- Preview Modal -->
{#if previewTemplate}
  <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
      <!-- Preview Header -->
      <div class="border-b border-gray-200 dark:border-gray-800 p-6 flex items-start justify-between">
        <div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">{previewTemplate.name}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{previewTemplate.description}</p>
        </div>
        <button
          onclick={() => (previewTemplate = null)}
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
        >
          ✕
        </button>
      </div>

      <!-- Preview Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <div class="space-y-4">
          {#each previewTemplate.questions_template as question}
            <div class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div class="flex items-start justify-between mb-2">
                <h4 class="font-semibold text-gray-900 dark:text-white">{question.title}</h4>
                <span class="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full font-medium">
                  {question.type}
                </span>
              </div>
              {#if question.options}
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  • {question.options.join(', ')}
                </div>
              {/if}
              {#if question.required}
                <span class="text-xs text-red-600 dark:text-red-400 font-medium">Required</span>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Preview Actions -->
      <div class="border-t border-gray-200 dark:border-gray-800 p-6 flex gap-3">
        <button
          onclick={() => (previewTemplate = null)}
          class="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Back
        </button>
        <button
          onclick={() => {
            handleSelectTemplate(previewTemplate);
            previewTemplate = null;
          }}
          class="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          Use This Template
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(.line-clamp-2) {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
