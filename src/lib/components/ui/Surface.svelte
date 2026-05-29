<script lang="ts">
  export let className = "";
  export let strong = false;
  export let muted = false;
</script>

<div
  class={`surface ${strong ? "surface-strong" : ""} ${muted ? "surface-muted" : ""} ${className}`.trim()}
>
  <slot />
</div>
