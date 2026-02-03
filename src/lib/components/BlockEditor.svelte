<!-- src/lib/components/BlockEditor.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { BlockElement, AnimationType } from '../types';

  export let block: BlockElement;

  const dispatch = createEventDispatcher();
  let showOptionalContent = false;

  const animationOptions: { value: AnimationType; label: string }[] = [
    { value: 'fade', label: 'Fade In' },
    { value: 'slide', label: 'Slide Up' },
    { value: 'pulse', label: 'Pulse' },
    { value: 'bounce', label: 'Bounce In' },
    { value: 'zoom', label: 'Zoom In' },
    { value: 'flip', label: 'Flip In' },
    { value: 'rotate', label: 'Rotate In' },
    { value: 'slideLeft', label: 'Slide Left' },
    { value: 'slideRight', label: 'Slide Right' },
    { value: 'wobble', label: 'Wobble' },
    { value: 'heartbeat', label: 'Heartbeat' },
    { value: 'swing', label: 'Swing' },
    { value: 'tada', label: 'Tada' },
    { value: 'jello', label: 'Jello' },
    { value: 'blink', label: 'Blink' }
  ];

  function updateBlock() {
    dispatch('update');
  }

  function handleImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      try {
        // Dynamic import to avoid issues
        import('$lib/supabaseClient').then(({ supabase }) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          supabase.storage
            .from('Images')
            .upload(`blocks/${fileName}`, file, { upsert: false })
            .then(({ error: uploadError, data }) => {
              if (uploadError) throw uploadError;
              
              const { data: { publicUrl } } = supabase.storage
                .from('Images')
                .getPublicUrl(`blocks/${fileName}`);
              
              block.imageUrl = publicUrl;
              updateBlock();
            })
            .catch((err) => {
              console.error('Error uploading image:', err);
              alert('Failed to upload image');
            });
        });
      } catch (err) {
        console.error('Error uploading image:', err);
        alert('Failed to upload image');
      }
    }
  }

  function handleDragStart(event: DragEvent) {
    dispatch('dragstart', event);
  }

  function handleDragEnd(event: DragEvent) {
    dispatch('dragend', event);
  }
</script>

<div class="border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
  <div class="flex items-start gap-4 mb-4">
    <div class="flex-shrink-0 pt-1">
      <div
        class="text-gray-300 cursor-grab active:cursor-grabbing hover:text-gray-400 transition-colors text-lg"
        draggable="true"
        on:dragstart={handleDragStart}
        on:dragend={handleDragEnd}
      >
        ⋮⋮
      </div>
    </div>
    <div class="flex-1 space-y-3">
      <div class="flex flex-wrap items-center gap-3">
        <span class="inline-flex items-center justify-center text-xs font-semibold tracking-wide px-3 py-1 rounded-full bg-blue-100 text-blue-700">
          Content Block
        </span>
        <button
          on:click={() => dispatch('delete')}
          class="ml-auto text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
          aria-label="Delete block"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
        </button>
      </div>

      <!-- Title -->
      <div class="space-y-2">
        <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Block Title</label>
        <input
          type="text"
          bind:value={block.title}
          on:input={updateBlock}
          placeholder="Enter block title"
          class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50"
        />
      </div>

      <!-- Main Content Text -->
      <div class="space-y-2">
        <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Content Text</label>
        <textarea
          rows="2"
          bind:value={block.text}
          on:input={updateBlock}
          placeholder="Enter the main content text for this block"
          class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 resize-none"
        ></textarea>
      </div>

      <!-- Optional Content Toggle -->
      <button
        on:click={() => (showOptionalContent = !showOptionalContent)}
        class="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 pt-2"
      >
        <svg class={`w-4 h-4 transition-transform ${showOptionalContent ? 'rotate-45' : ''}`} fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        {showOptionalContent ? 'Hide' : 'Add'} Optional Content
      </button>

      <!-- Optional Content Section -->
      {#if showOptionalContent}
        <div class="pt-4 space-y-3 border-t border-gray-200">
          <!-- Header Text -->
          <div class="space-y-2">
            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Header (optional)</label>
            <input
              type="text"
              bind:value={block.headerText}
              on:input={updateBlock}
              placeholder="Add header text"
              class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50"
            />
          </div>

          <!-- Footer Text -->
          <div class="space-y-2">
            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Footer (optional)</label>
            <input
              type="text"
              bind:value={block.footerText}
              on:input={updateBlock}
              placeholder="Add footer text"
              class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50"
            />
          </div>

          <!-- Image Upload -->
          <div class="space-y-2">
            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Block Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              on:change={handleImageUpload}
              class="w-full text-xs text-gray-700 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:bg-blue-100 file:text-blue-700 file:cursor-pointer hover:file:bg-blue-200"
            />
            {#if block.imageUrl}
              <button
                on:click={() => {
                  block.imageUrl = '';
                  updateBlock();
                }}
                class="w-full text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-1 hover:bg-red-100 transition-colors"
              >
                Remove Image
              </button>
            {/if}
          </div>

          <!-- Background Color -->
          <div class="space-y-2">
            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Background Color</label>
            <div class="flex gap-2">
              <input
                type="color"
                bind:value={block.backgroundColor}
                on:change={updateBlock}
                class="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                bind:value={block.backgroundColor}
                on:change={updateBlock}
                placeholder="#ffffff or transparent"
                class="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50"
              />
            </div>
          </div>

          <!-- Entry Animation -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="space-y-2">
              <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Entry Animation</label>
              <select
                bind:value={block.entryAnimation}
                on:change={updateBlock}
                class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value={undefined}>None</option>
                {#each animationOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>

            <!-- Exit Animation -->
            <div class="space-y-2">
              <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Exit Animation</label>
              <select
                bind:value={block.exitAnimation}
                on:change={updateBlock}
                class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
            <label class="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer">
              <input
                type="checkbox"
                bind:checked={block.enableAutoAdvance}
                on:change={updateBlock}
                class="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer accent-blue-600"
              />
              Auto-advance to next element
            </label>
            {#if block.enableAutoAdvance}
              <div class="space-y-1">
                <label for="delay" class="block text-xs text-gray-600">Delay (seconds)</label>
                <input
                  id="delay"
                  type="number"
                  min="0.5"
                  step="0.5"
                  bind:value={block.autoAdvanceDelay}
                  on:change={updateBlock}
                  class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50"
                />
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Preview -->
  <div class="space-y-2 mt-6 pt-6 border-t border-gray-200">
    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preview</p>
    <div
      class="block-preview rounded-lg border border-gray-200 p-4 min-h-[120px] flex flex-col"
      style="background-color: {block.backgroundColor || '#ffffff'};"
    >
      {#if block.headerText}
        <div class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          {block.headerText}
        </div>
      {/if}

      {#if block.imageUrl}
        <div class="mb-3 flex-1 overflow-hidden rounded">
          <img src={block.imageUrl} alt="Block preview" class="max-h-24 max-w-full object-contain" />
        </div>
      {/if}

      {#if block.text}
        <div class="text-sm text-gray-700 flex-1 mb-2 line-clamp-2">
          {block.text}
        </div>
      {/if}

      {#if block.footerText}
        <div class="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-300">
          {block.footerText}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .block-preview {
    word-wrap: break-word;
    word-break: break-word;
  }
</style>
