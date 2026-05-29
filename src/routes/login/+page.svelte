<script lang="ts">
  import { authClient } from "$lib/authClient";
  import { goto } from "$app/navigation";
  import PageHeader from "$lib/components/ui/PageHeader.svelte";
  import Surface from "$lib/components/ui/Surface.svelte";

  let loading = false;
  let errorMsg = "";
  let email = "";
  let password = "";

  async function handleLogin() {
    try {
      loading = true;
      errorMsg = "";

      const { error } = await authClient.signIn.email({ email, password });
      if (error) throw error;
      goto("/dashboard");
    } catch (error: any) {
      errorMsg = error.message || "Failed to sign in";
    } finally {
      loading = false;
    }
  }
</script>

<div class="app-shell">
  <main class="page-container flex min-h-screen items-center justify-center py-10">
    <div class="grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1.1fr)_420px]">
      <div class="hidden lg:flex lg:flex-col lg:justify-center">
        <PageHeader
          eyebrow="Quill"
          title="A quieter way to build forms"
          description="Design, publish, and review forms in one place, with collaboration and response handling built in."
        />
      </div>

      <Surface className="panel-section surface-strong">
        <div class="space-y-6">
          <PageHeader
            eyebrow="Sign in"
            title="Welcome back"
            description="Use your account to access forms, responses, and workspace settings."
          />

          <form class="space-y-5" on:submit|preventDefault={handleLogin}>
            {#if errorMsg}
              <div class="rounded-[10px] border px-4 py-3 text-sm" style="background: color-mix(in srgb, var(--danger) 10%, var(--surface-strong)); border-color: color-mix(in srgb, var(--danger) 20%, var(--border)); color: var(--danger);">
                {errorMsg}
              </div>
            {/if}

            <div>
              <label for="email" class="label">Email</label>
              <input id="email" bind:value={email} type="email" required placeholder="you@example.com" class="field" />
            </div>

            <div>
              <label for="password" class="label">Password</label>
              <input id="password" bind:value={password} type="password" required placeholder="••••••••" class="field" />
            </div>

            <button type="submit" disabled={loading} class="btn btn-primary w-full">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </Surface>
    </div>
  </main>
</div>
