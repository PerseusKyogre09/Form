<script lang="ts">
  export let title = "";
  export let description = "";
  export let icon = "";
  export let className = "";
</script>

<div class={`empty-state ${className}`.trim()}>
  {#if icon}
    <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full border surface-strong">
      <i class={`fas ${icon} text-sm muted`}></i>
    </div>
  {/if}
  <h3 class="text-base font-semibold text-[color:var(--text)]">{title}</h3>
  {#if description}
    <p class="mt-1 max-w-md text-sm leading-6 muted">{description}</p>
  {/if}
  <slot />
</div>
