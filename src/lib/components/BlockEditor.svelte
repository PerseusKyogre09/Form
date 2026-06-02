<!-- src/lib/components/BlockEditor.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { BlockElement, AnimationType } from "../types";

  export let block: BlockElement;

  const dispatch = createEventDispatcher();
  let showOptionalContent = false;

  const animationOptions: { value: AnimationType; label: string }[] = [
    { value: "fade", label: "Fade In" },
    { value: "slide", label: "Slide Up" },
    { value: "slideLeft", label: "Slide Left" },
    { value: "slideRight", label: "Slide Right" },
    { value: "zoom", label: "Zoom In" },
  ];

  function updateBlock() {
    dispatch("update");
  }

  function handleImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      try {
        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append('file', file);
        cloudinaryFormData.append('upload_preset', 'form_images');
        cloudinaryFormData.append('folder', 'quill/blocks');
        cloudinaryFormData.append('public_id', `block-${Date.now()}-${Math.random().toString(36).substring(7)}`);
        
        fetch('https://api.cloudinary.com/v1_1/dwqzgfghq/image/upload', {
          method: 'POST',
          body: cloudinaryFormData
        })
          .then(async (res) => {
            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error?.message || 'Failed to upload image');
            }
            const result = await res.json();
            block.imageUrl = result.secure_url;
            updateBlock();
          })
          .catch((err) => {
            console.error("Error uploading image:", err);
            alert("Failed to upload image");
          });
      } catch (err) {
        console.error("Error uploading image:", err);
        alert("Failed to upload image");
      }
    }
  }

  function handleDragStart(event: DragEvent) {
    dispatch("dragstart", event);
  }

  function handleDragEnd(event: DragEvent) {
    dispatch("dragend", event);
  }

  $: showCardPreview = block.showCard !== false;
</script>

<div
  class="surface surface-strong p-6 sm:p-8 group transition-all duration-200"
>
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <div
        class="cursor-grab active:cursor-grabbing text-[color:var(--text-soft)] opacity-60 hover:opacity-100"
        draggable="true"
        on:dragstart={(e) => {
          if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
          dispatch("dragstart", e);
        }}
        on:dragend={(e) => dispatch("dragend", e)}
        role="button"
        tabindex="0"
        aria-label="Drag to reorder"
      >
        <span class="fas fa-grip-vertical"></span>
      </div>
      <div class="flex items-center gap-2 text-[color:var(--text-soft)]">
        <span class="fas fa-newspaper text-lg"></span>
        <span class="text-sm font-semibold uppercase tracking-wide"
          >Content Block</span
        >
      </div>
    </div>

    <div class="flex items-center gap-4">
      <button
        on:click={() => dispatch("delete")}
        class="text-[color:var(--text-soft)] hover:text-[color:var(--danger)] transition-colors"
        aria-label="Delete block"
      >
        <span class="fas fa-trash text-xl"></span>
      </button>
      <button
        on:click={() => (showOptionalContent = !showOptionalContent)}
        class="text-[color:var(--text-soft)] hover:text-[color:var(--accent)] transition-colors"
        aria-label="Toggle optional content"
      >
        <span
          class="fas {showOptionalContent ? 'fa-eye-slash' : 'fa-eye'} text-xl"
        ></span>
      </button>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Main Content -->
    <div class="space-y-4">
      <!-- Header Text -->
      <div class="space-y-2">
        <label
          for="headerText"
          class="text-xs font-semibold text-[color:var(--text-soft)] uppercase tracking-wide"
          >Header Text</label
        >
        <input
          id="headerText"
          type="text"
          bind:value={block.headerText}
          on:change={updateBlock}
          placeholder="Optional header text"
          class="field w-full max-w-full break-words"
        />
      </div>

      <!-- Show Card Toggle -->
      <div class="space-y-2">
        <label
          class="flex items-center gap-2 text-xs font-semibold text-[color:var(--text-soft)] uppercase tracking-wide cursor-pointer"
        >
          <input
            type="checkbox"
            bind:checked={block.showCard}
            on:change={updateBlock}
            class="w-4 h-4 rounded border-[color:var(--border)] text-[color:var(--accent)] cursor-pointer accent-[color:var(--accent)] bg-[color:var(--surface-strong)]"
          />
          Show Card Styling
        </label>
        <p class="text-xs text-[color:var(--text-soft)] ml-6">
          Uncheck for IDE theme floating style (no card container)
        </p>
      </div>

      <!-- Main Text -->
      <div class="space-y-2">
        <label
          for="mainText"
          class="text-xs font-semibold text-[color:var(--text-soft)] uppercase tracking-wide"
          >Main Text</label
        >
        <textarea
          id="mainText"
          bind:value={block.text}
          on:change={updateBlock}
          placeholder="Main content for the block"
          rows="4"
          class="textarea w-full resize-none"
        ></textarea>
      </div>

      <!-- Footer Text -->
      <div class="space-y-2">
        <label
          for="footerText"
          class="text-xs font-semibold text-[color:var(--text-soft)] uppercase tracking-wide"
          >Footer Text</label
        >
        <input
          id="footerText"
          type="text"
          bind:value={block.footerText}
          on:change={updateBlock}
          placeholder="Optional footer text"
          class="field w-full"
        />
      </div>
    </div>

    <!-- Optional Content (conditionally rendered) -->
    <div class="space-y-4">
      {#if showOptionalContent}
        <div class="space-y-4">
          <!-- Image Upload -->
          <div class="space-y-2">
            <label
              for="block-image-{block.id}"
              class="text-xs font-semibold text-[color:var(--text-soft)] uppercase tracking-wide"
              >Image</label
            >
            {#if !block.imageUrl}
              <input
                id="block-image-{block.id}"
                type="file"
                accept="image/*"
                on:change={handleImageUpload}
                class="field w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[color:var(--accent-soft)] file:text-[color:var(--accent)] hover:file:bg-[color:var(--accent-soft)]"
              />
            {:else}
              <div class="flex items-center gap-3">
                <img
                  src={block.imageUrl}
                  alt="Uploaded block preview"
                  class="h-16 w-16 object-cover rounded-lg border border-[color:var(--border)]"
                />
                <button
                  on:click={() => {
                    block.imageUrl = undefined;
                    updateBlock();
                  }}
                  class="btn btn-danger btn-sm w-full justify-center"
                >
                  Remove Image
                </button>
              </div>
            {/if}
          </div>

          <!-- Background Color -->
          <div class="space-y-2">
            <label
              for="bg-color-picker-{block.id}"
              class="text-xs font-semibold text-[color:var(--text-soft)] uppercase tracking-wide"
              >Background Color</label
            >
            <div class="flex gap-2">
              <input
                id="bg-color-picker-{block.id}"
                type="color"
                bind:value={block.backgroundColor}
                on:change={updateBlock}
                class="w-12 h-10 border border-[color:var(--border)] rounded-lg cursor-pointer bg-[color:var(--surface-strong)]"
              />
              <input
                type="text"
                bind:value={block.backgroundColor}
                on:change={updateBlock}
                placeholder="#ffffff or transparent"
                aria-label="Background color hex value"
                class="flex-1 text-sm border border-[color:var(--border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] transition-all bg-[color:var(--surface-muted)] text-[color:var(--text)]"
              />
            </div>
            <div class="mt-2 text-right">
              <button
                type="button"
                on:click={() => {
                  block.backgroundColor = "transparent";
                  updateBlock();
                }}
                class="text-xs text-[color:var(--text-soft)] hover:text-[color:var(--text)] underline transition-colors"
              >
                Set to Transparent
              </button>
            </div>
          </div>

          <!-- Text Color Override -->
          <div class="space-y-2">
            <label
              for="text-color-picker-{block.id}"
              class="text-xs font-semibold text-[color:var(--text-soft)] uppercase tracking-wide"
              >Text Color (Override)</label
            >
            <div class="flex gap-2">
              <input
                id="text-color-picker-{block.id}"
                type="color"
                bind:value={block.textColor}
                on:change={updateBlock}
                class="w-12 h-10 border border-[color:var(--border)] rounded-lg cursor-pointer bg-[color:var(--surface-strong)]"
              />
              <button
                type="button"
                on:click={() => {
                  block.textColor = undefined;
                  updateBlock();
                }}
                class="text-xs text-[color:var(--text-soft)] hover:text-[color:var(--danger)] underline"
              >
                Reset
              </button>
            </div>
          </div>

          <!-- Entry Animation -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="space-y-2">
              <label
                for="entry-animation-{block.id}"
                class="text-xs font-semibold text-[color:var(--text-soft)] uppercase tracking-wide"
                >Entry Animation</label
              >
              <select
                id="entry-animation-{block.id}"
                bind:value={block.entryAnimation}
                on:change={updateBlock}
                class="w-full text-sm border border-[color:var(--border)] rounded-lg px-3 py-2 bg-[color:var(--surface-strong)] text-[color:var(--text)] hover:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] transition-all"
              >
                <option value={undefined}>None</option>
                {#each animationOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>

            <!-- Exit Animation -->
            <div class="space-y-2">
              <label
                for="exit-animation-{block.id}"
                class="text-xs font-semibold text-[color:var(--text-soft)] uppercase tracking-wide"
                >Exit Animation</label
              >
              <select
                id="exit-animation-{block.id}"
                bind:value={block.exitAnimation}
                on:change={updateBlock}
                class="w-full text-sm border border-[color:var(--border)] rounded-lg px-3 py-2 bg-[color:var(--surface-strong)] text-[color:var(--text)] hover:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] transition-all"
              >
                <option value={undefined}>None</option>
                {#each animationOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
          </div>

          <!-- Auto-advance -->
          <div class="space-y-2">
            <label
              class="flex items-center gap-2 text-xs font-semibold text-[color:var(--text-soft)] uppercase tracking-wide cursor-pointer"
            >
              <input
                type="checkbox"
                bind:checked={block.enableAutoAdvance}
                on:change={updateBlock}
                class="w-4 h-4 rounded border-[color:var(--border)] text-[color:var(--accent)] cursor-pointer accent-[color:var(--accent)] bg-[color:var(--surface-strong)]"
              />
              Auto-advance to next element
            </label>
            {#if block.enableAutoAdvance}
              <div class="space-y-1">
                <label
                  for="delay"
                  class="block text-xs text-[color:var(--text-muted)]"
                  >Delay (seconds)</label
                >
                <input
                  id="delay"
                  type="number"
                  min="0.5"
                  step="0.5"
                  bind:value={block.autoAdvanceDelay}
                  on:change={updateBlock}
                  class="w-full text-sm border border-[color:var(--border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] transition-all bg-[color:var(--surface-muted)] text-[color:var(--text)]"
                />
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Preview -->
  <div
    class="space-y-2 mt-6 pt-6 border-t border-[color:var(--border)]"
  >
    <p
      class="text-xs font-semibold text-[color:var(--text-soft)] uppercase tracking-wide"
    >
      Preview
    </p>
    {#if block.showCard === false}
      <!-- IDE Theme Preview (no card - floating) -->
      <div
        class="rounded-lg border border-gray-600 p-4 min-h-[120px] flex flex-col bg-gray-900"
      >
        {#if block.headerText}
          <div class="text-sm md:text-base font-mono text-teal-400 mb-2">
            {block.headerText}
          </div>
        {/if}

        {#if block.imageUrl}
          <div class="mb-3 flex-1 overflow-hidden rounded opacity-20">
            <img
              src={block.imageUrl}
              alt="Block preview"
              class="max-h-20 max-w-full object-contain"
            />
          </div>
        {/if}

        {#if block.text}
          <div
            class="text-xs md:text-sm text-white font-mono flex-1 mb-2 line-clamp-2"
          >
            {block.text}<span
              class="inline-block w-1 h-4 ml-2 bg-white align-middle"
            ></span>
          </div>
        {/if}

        {#if block.footerText}
          <div
            class="text-xs text-gray-500 font-mono mt-2 pt-2 border-t border-gray-700"
          >
            // {block.footerText}
          </div>
        {/if}
      </div>
    {:else}
      <!-- Card Style Preview (with or without IDE theme) -->
      <div
        class="block-preview rounded-lg border border-[color:var(--border)] p-4 min-h-[120px] flex flex-col"
        style="background-color: {block.backgroundColor || 'var(--surface)'}; color: {block.textColor || 'var(--text)'};"
      >
        {#if block.headerText}
          <div
            class="text-xs font-bold {block.backgroundColor === '#252526'
              ? 'font-mono text-teal-400'
              : 'text-[color:var(--text-soft)]'} uppercase tracking-wide mb-2"
          >
            {block.headerText}
          </div>
        {/if}

        {#if block.imageUrl}
          <div class="mb-3 flex-1 overflow-hidden rounded">
            <img
              src={block.imageUrl}
              alt="Block preview"
              class="max-h-24 max-w-full object-contain"
            />
          </div>
        {/if}

        {#if block.text}
          <div
            class="text-sm {block.backgroundColor === '#252526'
              ? 'text-gray-300 font-mono'
              : 'text-[color:var(--text)]'} flex-1 mb-2 line-clamp-2"
          >
            {block.text}
          </div>
        {/if}

        {#if block.footerText}
          <div
            class="text-xs {block.backgroundColor === '#252526'
              ? 'text-gray-500 font-mono'
              : 'text-[color:var(--text-soft)]'} mt-2 pt-2 {block.backgroundColor === '#252526'
              ? 'border-gray-700'
              : 'border-[color:var(--border)]'} border-t"
          >
            {block.backgroundColor === "#252526" ? "// " : ""}{block.footerText}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .block-preview {
    word-wrap: break-word;
    word-break: break-word;
  }
</style>
