<script lang="ts">
  import { authClient } from "$lib/authClient";
  import { goto } from "$app/navigation";
  import EmptyState from "$lib/components/ui/EmptyState.svelte";
  import Surface from "$lib/components/ui/Surface.svelte";

  async function handleLogout() {
    await authClient.signOut();
    goto("/login");
  }
</script>

<div class="app-shell">
  <main class="page-container flex min-h-screen items-center justify-center py-10">
    <Surface className="panel-section max-w-lg text-center">
      <EmptyState
        icon="fa-shield-alt"
        title="Access restricted"
        description="You do not have permission to view this area. Sign in with an authorized account or return to a permitted section."
      >
        <div class="mt-5 flex justify-center">
          <button type="button" class="btn btn-danger" on:click={handleLogout}>
            Sign out
          </button>
        </div>
      </EmptyState>
    </Surface>
  </main>
</div>
