<!-- src/lib/components/AnimationEditor.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { AnimationElement, AnimationType } from '../types';

  export let animation: AnimationElement;

  const dispatch = createEventDispatcher();
  
  // Initialize defaults
  $: if (!animation.backgroundColor) {
    animation.backgroundColor = 'transparent';
  }
  $: if (animation.autoAdvanceDelay === undefined) {
    animation.autoAdvanceDelay = 3;
  }
  // Always play once - no repeats allowed
  animation.repeatMode = 'once';
  animation.repeatCount = 1;

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

  function updateAnimation() {
    dispatch('update');
  }

  function handleDragStart(event: DragEvent) {
    dispatch('dragstart', event);
  }

  function handleDragEnd(event: DragEvent) {
    dispatch('dragend', event);
  }

  async function handleImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      try {
        const { supabase } = await import('$lib/supabaseClient');
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('Images')
          .upload(`animation-blocks/${fileName}`, file, { upsert: false });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('Images')
          .getPublicUrl(`animation-blocks/${fileName}`);
        
        animation.assetUrl = publicUrl;
        updateAnimation();
      } catch (err) {
        console.error('Error uploading image:', err);
        alert('Failed to upload image');
      }
    }
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
        <span class="inline-flex items-center justify-center text-xs font-semibold tracking-wide px-3 py-1 rounded-full bg-purple-100 text-purple-700">
          Animation Block
        </span>
        <button
          on:click={() => dispatch('delete')}
          class="ml-auto text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
          aria-label="Delete animation"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
        </button>
      </div>
      <div class="space-y-2">
        <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</label>
        <input
          type="text"
          bind:value={animation.title}
          on:input={updateAnimation}
          placeholder="Enter animation title"
          class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all bg-gray-50"
        />
      </div>
      <div class="space-y-2">
        <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description (optional)</label>
        <textarea
          rows="1"
          bind:value={animation.description}
          on:input={updateAnimation}
          placeholder="Add a supporting message"
          class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all bg-gray-50 resize-none"
        ></textarea>
      </div>
      <div class="space-y-2">
        <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Animation Image (optional)</label>
        <input
          type="file"
          accept="image/*"
          on:change={handleImageUpload}
          class="w-full text-xs text-gray-700 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:bg-purple-100 file:text-purple-700 file:cursor-pointer hover:file:bg-purple-200"
        />
        {#if animation.assetUrl}
          <button
            on:click={() => {
              animation.assetUrl = '';
              updateAnimation();
            }}
            class="w-full text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-1 hover:bg-red-100 transition-colors mt-1"
          >
            Remove Image
          </button>
        {/if}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="space-y-2">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Animation type</label>
          <select
            bind:value={animation.animationType}
            on:change={updateAnimation}
            class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          >
            {#each animationOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
        <div class="space-y-2">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Background Color</label>
          <div class="flex gap-2">
            <input
              type="color"
              bind:value={animation.backgroundColor}
              on:change={updateAnimation}
              class="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              bind:value={animation.backgroundColor}
              on:change={updateAnimation}
              placeholder="#a855f7 or transparent"
              class="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all bg-gray-50"
            />
          </div>
        </div>
      </div>
      <div class="space-y-2">
        <label class="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer">
          <input
            type="checkbox"
            bind:checked={animation.enableAutoAdvance}
            on:change={updateAnimation}
            class="w-4 h-4 rounded border-gray-300 text-purple-600 cursor-pointer accent-purple-600"
          />
          Auto-advance to next question
        </label>
        {#if animation.enableAutoAdvance}
          <div class="space-y-1">
            <label for="delay" class="block text-xs text-gray-600">Delay (seconds)</label>
            <input
              id="delay"
              type="number"
              min="0.5"
              step="0.5"
              bind:value={animation.autoAdvanceDelay}
              on:change={updateAnimation}
              class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all bg-gray-50"
            />
          </div>
        {/if}
      </div>
    </div>
  </div>
  <div class="space-y-2">
    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preview</p>
    <div class={`animation-preview animation-${animation.animationType}`} style="background: {animation.backgroundColor || 'transparent'}; border: 1px solid {animation.backgroundColor === 'transparent' ? 'rgba(229, 231, 235, 1)' : 'transparent'}; animation-iteration-count: 1;">
      {#if animation.assetUrl}
        <img src={animation.assetUrl} alt="Animation preview" class="max-h-full max-w-full object-contain" />
      {:else}
        <div class="text-center space-y-2">
          <span class="text-sm font-semibold {animation.backgroundColor === 'transparent' ? 'text-gray-600' : 'text-white'}">{animation.title || 'Animation'}</span>
          {#if animation.enableAutoAdvance}
            <p class="text-xs {animation.backgroundColor === 'transparent' ? 'text-gray-400' : 'text-white text-opacity-80'}">
              Auto-advance in {animation.autoAdvanceDelay || 3}s
            </p>
          {/if}
          <p class="text-xs {animation.backgroundColor === 'transparent' ? 'text-gray-400' : 'text-white text-opacity-80'}">
            (plays once)
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .animation-preview {
    min-height: 140px;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
    padding: 1.5rem;
  }

  .animation-preview.animation-fade {
    animation: fadeIn 3s ease-in-out infinite;
  }

  .animation-preview.animation-slide {
    animation: slideUp 2.8s ease-in-out infinite;
  }

  .animation-preview.animation-pulse {
    animation: pulseOut 2.2s ease-in-out infinite;
  }

  .animation-preview img {
    max-height: 100%;
    max-width: 100%;
    object-fit: contain;
    border-radius: 0.75rem;
  }

  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    30% {
      opacity: 1;
    }
    70% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  @keyframes slideUp {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    30% {
      opacity: 1;
      transform: translateY(0);
    }
    70% {
      opacity: 1;
      transform: translateY(0);
    }
    100% {
      opacity: 0;
      transform: translateY(-20px);
    }
  }

  @keyframes pulseOut {
    0% {
      opacity: 0;
      transform: scale(0.9);
    }
    30% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
    70% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(1.1);
    }
  }
</style>
