<script lang="ts">
  export let eyebrow = "";
  export let title = "";
  export let description = "";
  export let align: "left" | "center" = "left";
</script>

<div
  class={`flex flex-col gap-2 ${align === "center" ? "items-center text-center" : ""}`.trim()}
>
  {#if eyebrow}
    <p class="eyebrow">{eyebrow}</p>
  {/if}
  {#if title}
    <h1 class="page-title">{title}</h1>
  {/if}
  {#if description}
    <p class="max-w-3xl text-sm leading-6 muted sm:text-[15px]">
      {description}
    </p>
  {/if}
  <slot />
</div>
