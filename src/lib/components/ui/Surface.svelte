<script lang="ts">
  export let className = "";
  export let strong = false;
  export let elevated = false;
  export let muted = false;
</script>

<div
  class={`surface ${strong ? "surface-strong" : ""} ${elevated ? "surface-elevated" : ""} ${muted ? "surface-muted" : ""} ${className}`.trim()}
>
  <slot />
</div>
