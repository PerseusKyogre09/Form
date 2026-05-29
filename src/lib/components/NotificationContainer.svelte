<script lang="ts">
  import { fly, fade } from "svelte/transition";
  import { notifications } from "../stores/notifications";

  function getTheme(type: string) {
    switch (type) {
      case "success":
        return {
          icon: "fa-check",
          accent: "var(--success)",
          background: "color-mix(in srgb, var(--success) 10%, var(--surface-strong))",
          border: "color-mix(in srgb, var(--success) 18%, var(--border))",
        };
      case "error":
        return {
          icon: "fa-exclamation",
          accent: "var(--danger)",
          background: "color-mix(in srgb, var(--danger) 10%, var(--surface-strong))",
          border: "color-mix(in srgb, var(--danger) 18%, var(--border))",
        };
      default:
        return {
          icon: "fa-info",
          accent: "var(--accent)",
          background: "color-mix(in srgb, var(--accent) 10%, var(--surface-strong))",
          border: "color-mix(in srgb, var(--accent) 18%, var(--border))",
        };
    }
  }
</script>

<div class="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-3 sm:right-6 sm:top-6">
  {#each $notifications as notification (notification.id)}
    {@const theme = getTheme(notification.type)}
    <div
      in:fly={{ y: -10, duration: 160 }}
      out:fade={{ duration: 140 }}
      class="pointer-events-auto flex items-start gap-3 rounded-[12px] border px-4 py-3 shadow-sm"
      style={`background:${theme.background}; border-color:${theme.border};`}
      role="status"
      aria-live="polite"
    >
      <div
        class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={`background:${theme.accent}; color: var(--surface-strong);`}
      >
        <i class={`fas ${theme.icon} text-[11px]`}></i>
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm leading-6 text-[color:var(--text)]">{notification.message}</p>
      </div>
      <button
        type="button"
        class="icon-btn h-8 w-8 border-transparent bg-transparent"
        aria-label="Dismiss notification"
        on:click={() => notifications.remove(notification.id)}
      >
        <i class="fas fa-times text-[11px]"></i>
      </button>
    </div>
  {/each}
</div>
