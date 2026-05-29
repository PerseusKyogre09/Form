<script lang="ts">
  export let title = "";
  export let description = "";
  export let maxWidthClass = "max-w-2xl";
  export let closeLabel = "Close dialog";
  export let onClose: (() => void) | undefined = undefined;
</script>

<div
  class="modal-backdrop"
  role="presentation"
  on:click={(event) => {
    if (event.target === event.currentTarget) onClose?.();
  }}
>
  <div class={`modal-panel ${maxWidthClass}`.trim()} role="dialog" aria-modal="true" aria-label={title || closeLabel}>
    <div class="flex items-start justify-between gap-4 border-b app-divider px-5 py-4">
      <div class="min-w-0 space-y-1">
        {#if title}
          <h2 class="text-lg font-semibold tracking-tight text-[color:var(--text)]">{title}</h2>
        {/if}
        {#if description}
          <p class="text-sm leading-6 muted">{description}</p>
        {/if}
      </div>
      {#if onClose}
        <button class="icon-btn h-9 w-9 shrink-0" on:click={onClose} aria-label={closeLabel}>
          <i class="fas fa-times text-sm"></i>
        </button>
      {/if}
    </div>
    <div class="max-h-[calc(88vh-72px)] overflow-y-auto">
      <slot />
    </div>
  </div>
</div>
