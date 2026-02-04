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
    { value: "pulse", label: "Pulse" },
    { value: "bounce", label: "Bounce In" },
    { value: "zoom", label: "Zoom In" },
    { value: "flip", label: "Flip In" },
    { value: "rotate", label: "Rotate In" },
    { value: "slideLeft", label: "Slide Left" },
    { value: "slideRight", label: "Slide Right" },
    { value: "wobble", label: "Wobble" },
    { value: "heartbeat", label: "Heartbeat" },
    { value: "swing", label: "Swing" },
    { value: "tada", label: "Tada" },
    { value: "jello", label: "Jello" },
    { value: "blink", label: "Blink" },
  ];

  function updateBlock() {
    dispatch("update");
  }

  function handleImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      try {
        // Dynamic import to avoid issues
        import("$lib/supabaseClient").then(({ supabase }) => {
          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          supabase.storage
            .from("Images")
            .upload(`blocks/${fileName}`, file, { upsert: false })
            .then(({ error: uploadError, data }) => {
              if (uploadError) throw uploadError;

              const {
                data: { publicUrl },
              } = supabase.storage
                .from("Images")
                .getPublicUrl(`blocks/${fileName}`);

              block.imageUrl = publicUrl;
              updateBlock();
            })
            .catch((err) => {
              console.error("Error uploading image:", err);
              alert("Failed to upload image");
            });
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
</script>

<div
  class="bg-surface-light bg-surface p-8 rounded-xl border border-slate-200 custom-shadow group transition-all duration-200"
>
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <div
        class="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400"
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
      <div class="flex items-center gap-2 text-slate-500">
        <span class="fas fa-newspaper text-lg"></span>
        <span class="text-sm font-semibold uppercase tracking-wide"
          >Content Block</span
        >
      </div>
    </div>

    <div class="flex items-center gap-4">
      <button
        on:click={() => dispatch("delete")}
        class="text-slate-400 hover:text-red-500 transition-colors"
      >
        <span class="fas fa-trash text-xl"></span>
      </button>
      <button
        on:click={() => (showOptionalContent = !showOptionalContent)}
        class="text-slate-400 hover:text-blue-500 transition-colors"
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
          class="text-xs font-semibold text-slate-500 uppercase tracking-wide"
          >Header Text</label
        >
        <input
          id="headerText"
          type="text"
          bind:value={block.headerText}
          on:change={updateBlock}
          placeholder="Optional header text"
          class="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary transition-all bg-slate-50 bg-slate-50 text-slate-900 placeholder:text-slate-400"
        />
      </div>

      <!-- Main Text -->
      <div class="space-y-2">
        <label
          for="mainText"
          class="text-xs font-semibold text-slate-500 uppercase tracking-wide"
          >Main Text</label
        >
        <textarea
          id="mainText"
          bind:value={block.text}
          on:change={updateBlock}
          placeholder="Main content for the block"
          rows="4"
          class="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary transition-all bg-slate-50 bg-slate-50 text-slate-900 placeholder:text-slate-400 resize-none"
        ></textarea>
      </div>

      <!-- Footer Text -->
      <div class="space-y-2">
        <label
          for="footerText"
          class="text-xs font-semibold text-slate-500 uppercase tracking-wide"
          >Footer Text</label
        >
        <input
          id="footerText"
          type="text"
          bind:value={block.footerText}
          on:change={updateBlock}
          placeholder="Optional footer text"
          class="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary transition-all bg-slate-50 bg-slate-50 text-slate-900 placeholder:text-slate-400"
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
              class="text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >Image</label
            >
            {#if !block.imageUrl}
              <input
                type="file"
                accept="image/*"
                on:change={handleImageUpload}
                class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            {:else}
              <div class="flex items-center gap-3">
                <img
                  src={block.imageUrl}
                  alt="Block image"
                  class="h-16 w-16 object-cover rounded-lg border border-gray-200"
                />
                <button
                  on:click={() => {
                    block.imageUrl = undefined;
                    updateBlock();
                  }}
                  class="w-full text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-1 hover:bg-red-100 transition-colors"
                >
                  Remove Image
                </button>
              </div>
            {/if}
          </div>

          <!-- Background Color -->
          <div class="space-y-2">
            <label
              class="text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >Background Color</label
            >
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
            <div class="mt-2 text-right">
              <button
                type="button"
                on:click={() => {
                  block.backgroundColor = "transparent";
                  updateBlock();
                }}
                class="text-xs text-slate-500 hover:text-slate-800 underline transition-colors"
              >
                Set to Transparent
              </button>
            </div>
          </div>

          <!-- Text Color Override -->
          <div class="space-y-2">
            <label
              class="text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >Text Color (Override)</label
            >
            <div class="flex gap-2">
              <input
                type="color"
                bind:value={block.textColor}
                on:change={updateBlock}
                class="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
              <button
                type="button"
                on:click={() => {
                  block.textColor = undefined;
                  updateBlock();
                }}
                class="text-xs text-slate-400 hover:text-red-500 underline"
              >
                Reset
              </button>
            </div>
          </div>

          <!-- Entry Animation -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="space-y-2">
              <label
                class="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >Entry Animation</label
              >
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
              <label
                class="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >Exit Animation</label
              >
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
            <label
              class="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer"
            >
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
                <label for="delay" class="block text-xs text-gray-600"
                  >Delay (seconds)</label
                >
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
    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
      Preview
    </p>
    <div
      class="block-preview rounded-lg border border-gray-200 p-4 min-h-[120px] flex flex-col"
      style="background-color: {block.backgroundColor || '#ffffff'};"
    >
      {#if block.headerText}
        <div
          class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2"
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
