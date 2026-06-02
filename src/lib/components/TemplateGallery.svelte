<script lang="ts">
  import { onMount } from "svelte";
  import type { FormTemplate } from "../types";
  import { isQuestionElement } from "../types";
  import { FORM_TEMPLATES, TEMPLATE_CATEGORIES } from "../templates";
  import ModalShell from "./ui/ModalShell.svelte";
  import Surface from "./ui/Surface.svelte";

  interface Props {
    onSelect: (template: FormTemplate) => void;
    onCancel?: () => void;
  }

  let { onSelect, onCancel }: Props = $props();

  let selectedCategory = $state<string>("all");
  let filteredTemplates = $state<FormTemplate[]>([]);
  let previewTemplate = $state<FormTemplate | null>(null);

  onMount(() => {
    updateFiltered();
  });

  function updateFiltered() {
    filteredTemplates =
      selectedCategory === "all"
        ? FORM_TEMPLATES
        : FORM_TEMPLATES.filter((template) => template.category === selectedCategory);
  }

  function handleCategoryChange(category: string) {
    selectedCategory = category;
    updateFiltered();
  }

  function handleSelectTemplate(template: FormTemplate) {
    onSelect(template);
  }
</script>

<ModalShell
  title="Choose a template"
  description="Start from a focused draft or begin with a blank form."
  maxWidthClass="max-w-6xl"
  onClose={onCancel}
>
  <div class="border-b app-divider px-5 py-4">
    <div class="flex gap-2 overflow-x-auto">
      {#each TEMPLATE_CATEGORIES as category}
        <button
          type="button"
          on:click={() => handleCategoryChange(category.id)}
          class="btn btn-sm whitespace-nowrap"
          class:btn-primary={selectedCategory === category.id}
          class:btn-secondary={selectedCategory !== category.id}
        >
          <i class={`fas ${category.icon} text-[11px]`}></i>
          <span>{category.name}</span>
        </button>
      {/each}
    </div>
  </div>

  <div class="max-h-[72vh] overflow-y-auto p-5">
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <button
        type="button"
        on:click={() => onSelect({} as FormTemplate)}
        class="flex min-h-[220px] flex-col items-start justify-between rounded-[12px] border border-dashed p-5 text-left transition-colors surface-muted hover:border-[color:var(--accent)]"
      >
        <div class="space-y-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-[10px] border surface-elevated">
            <i class="fas fa-file-lines text-sm text-[color:var(--accent)]"></i>
          </div>
          <div>
            <h3 class="text-base font-semibold tracking-tight text-[color:var(--text)]">Blank form</h3>
            <p class="mt-1 text-sm leading-6 muted">Start from scratch and shape the flow yourself.</p>
          </div>
        </div>
        <span class="text-sm font-medium text-[color:var(--accent)]">Open blank builder</span>
      </button>

      {#each filteredTemplates as template}
        <button
          type="button"
          on:click={() => handleSelectTemplate(template)}
          class="overflow-hidden rounded-[12px] border text-left shadow-sm transition-transform duration-150 hover:-translate-y-0.5 surface"
          style={`border-color: var(--border);`}
        >
          <div class="flex min-h-[220px] flex-col justify-between p-5">
            <div class="space-y-4">
              <div class="flex items-start justify-between gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[color:var(--border)] surface-elevated text-sm text-[color:var(--text)]">
                  <i class={`fas ${template.icon}`}></i>
                </div>
                {#if template.preview_text}
                  <span class="rounded-full border border-[color:var(--border)] surface-elevated px-2.5 py-1 text-[11px] font-medium text-[color:var(--text)]">
                    {template.preview_text}
                  </span>
                {/if}
              </div>
              <div>
                <h3 class="text-base font-semibold tracking-tight text-[color:var(--text)]">{template.name}</h3>
                <p class="mt-1 line-clamp-2 text-sm leading-6 text-[color:color-mix(in_srgb,var(--text) 72%, transparent)]">
                  {template.description}
                </p>
              </div>
            </div>

            <div class="flex items-center justify-between gap-3 pt-4">
              <span class="text-xs muted-soft">
                {template.questions_template.length} questions
              </span>
              <span
                role="button"
                tabindex="0"
                class="text-sm font-medium text-[color:var(--accent)]"
                on:click={(event) => {
                  event.stopPropagation();
                  previewTemplate = template;
                }}
                on:keydown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    previewTemplate = template;
                  }
                }}
              >
                Preview
              </span>
            </div>
          </div>
        </button>
      {/each}
    </div>
  </div>
</ModalShell>

{#if previewTemplate}
  <ModalShell
    title={previewTemplate.name}
    description={previewTemplate.description}
    maxWidthClass="max-w-2xl"
    onClose={() => (previewTemplate = null)}
  >
    <div class="space-y-4 p-5">
      <div class="space-y-3">
        {#each previewTemplate.questions_template as question}
          <Surface muted={true} className="panel-section">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h4 class="text-sm font-semibold text-[color:var(--text)]">{question.title}</h4>
                {#if isQuestionElement(question) && question.options}
                  <p class="mt-1 text-sm leading-6 muted">{question.options.join(", ")}</p>
                {/if}
              </div>
              <span class="status-badge badge-muted">{isQuestionElement(question) ? question.type : "block"}</span>
            </div>
            {#if isQuestionElement(question) && question.required}
              <p class="mt-2 text-xs text-[color:var(--danger)]">Required</p>
            {/if}
          </Surface>
        {/each}
      </div>

      <div class="flex justify-end gap-2">
        <button type="button" class="btn btn-secondary" on:click={() => (previewTemplate = null)}>
          Back
        </button>
        <button
          type="button"
          class="btn btn-primary"
          on:click={() => {
            if (!previewTemplate) return;
            handleSelectTemplate(previewTemplate);
            previewTemplate = null;
          }}
        >
          Use template
        </button>
      </div>
    </div>
  </ModalShell>
{/if}

<style>
  :global(.line-clamp-2) {
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
