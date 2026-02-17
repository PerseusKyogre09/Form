<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    // Signup is disabled - redirect to login
    onMount(() => {
        goto("/login");
    });
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
    <p class="text-gray-500">Redirecting to login...</p>
</div>
