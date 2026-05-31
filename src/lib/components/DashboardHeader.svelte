<script lang="ts">
  import { onMount } from "svelte";
  import { Avatar } from "bits-ui";
  import { authClient } from "$lib/authClient";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import favicon from "$lib/assets/favicon.svg";

  let user = $state<any>(null);
  let currentPath = $derived($page.url.pathname);
  let { onNewForm }: { onNewForm?: () => void } = $props();

  onMount(async () => {
    const { data: session } = await authClient.getSession();
    user = session?.user || null;

    if (user) {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const { profile } = await res.json();
          if (profile?.image) user.image = profile.image;
        }
      } catch (error) {
        console.error("Failed to load profile image:", error);
      }
    }
  });

  async function handleLogout() {
    await authClient.signOut();
    goto("/login");
  }

  function isCurrent(path: string) {
    return currentPath === path || currentPath.startsWith(`${path}/`);
  }
</script>

<header class="app-topbar">
  <div class="page-container flex h-16 items-center justify-between gap-4">
    <div class="flex min-w-0 items-center gap-4 sm:gap-6">
      <a href={user ? "/dashboard" : "/"} class="flex items-center gap-3">
        <img src={favicon} alt="Quill" class="h-7 w-7 rounded-[8px]" />
        <div class="min-w-0">
          <p class="text-sm font-semibold tracking-tight text-[color:var(--text)]">Quill</p>
          <p class="hidden text-xs leading-4 muted sm:block">Forms, responses, check-in</p>
        </div>
      </a>

      <nav class="hidden items-center gap-1 md:flex">
        {#if user}
          <a
            href="/dashboard"
            class={`segmented-item ${isCurrent("/dashboard") || isCurrent("/form-builder") ? "surface-strong shadow-sm text-[color:var(--text)]" : ""}`.trim()}
          >
            Forms
          </a>
        {/if}
        <a
          href="/certificate-generator"
          class={`segmented-item ${isCurrent("/certificate-generator") ? "surface-strong shadow-sm text-[color:var(--text)]" : ""}`.trim()}
        >
          Certificates
        </a>
        <a
          href="/theme-builder"
          class={`segmented-item ${isCurrent("/theme-builder") ? "surface-strong shadow-sm text-[color:var(--text)]" : ""}`.trim()}
        >
          Theme Builder
        </a>
      </nav>
    </div>

    <div class="flex items-center gap-2 sm:gap-3">
      {#if currentPath === "/dashboard" && user}
        <button type="button" class="btn btn-primary hidden sm:inline-flex" onclick={onNewForm}>
          <i class="fas fa-plus text-xs"></i>
          <span>New form</span>
        </button>
        <button type="button" class="icon-btn sm:hidden" onclick={onNewForm} aria-label="Create new form">
          <i class="fas fa-plus text-xs"></i>
        </button>
      {/if}

      {#if user}
        <div class="relative group">
          <button class="flex items-center gap-2 rounded-[10px] border px-2 py-1.5 transition-colors surface-strong" aria-label="Open profile menu">
            <Avatar.Root class="h-8 w-8 overflow-hidden rounded-full border border-[color:var(--border)]">
              <Avatar.Image
                src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                alt={user.email || "User avatar"}
                class="h-full w-full object-cover"
              />
              <Avatar.Fallback class="flex h-full w-full items-center justify-center bg-[color:var(--accent-soft)] text-xs font-semibold text-[color:var(--accent)]">
                {user.email?.charAt(0).toUpperCase() || "U"}
              </Avatar.Fallback>
            </Avatar.Root>
            <span class="hidden max-w-[160px] truncate text-sm font-medium text-[color:var(--text)] sm:block">
              {user.name || user.email}
            </span>
            <i class="fas fa-chevron-down text-[10px] muted"></i>
          </button>

          <div class="invisible absolute right-0 top-full z-50 mt-2 w-52 translate-y-1 opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
            <div class="surface surface-strong overflow-hidden py-1">
              <a href="/profile" class="flex items-center gap-2 px-3 py-2 text-sm text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-muted)]">
                <i class="fas fa-user text-xs muted"></i>
                <span>Profile</span>
              </a>
              {#if user?.role === "admin" || currentPath.startsWith("/admin")}
                <a href="/admin" class="flex items-center gap-2 px-3 py-2 text-sm text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-muted)]">
                  <i class="fas fa-shield-alt text-xs muted"></i>
                  <span>Admin</span>
                </a>
              {/if}
              <button type="button" onclick={handleLogout} class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[color:var(--danger)] transition-colors hover:bg-[color:var(--surface-muted)]">
                <i class="fas fa-sign-out-alt text-xs"></i>
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      {:else}
        <a href="/login" class="btn btn-secondary">Log in</a>
      {/if}
    </div>
  </div>

  <div class="border-t border-[color:var(--border-subtle)] md:hidden">
    <div class="page-container">
      <nav class="flex gap-2 overflow-x-auto py-2">
        {#if user}
          <a
            href="/dashboard"
            class={`segmented-item whitespace-nowrap ${isCurrent("/dashboard") || isCurrent("/form-builder") ? "surface-strong shadow-sm text-[color:var(--text)]" : ""}`.trim()}
          >
            Forms
          </a>
        {/if}
        <a
          href="/certificate-generator"
          class={`segmented-item whitespace-nowrap ${isCurrent("/certificate-generator") ? "surface-strong shadow-sm text-[color:var(--text)]" : ""}`.trim()}
        >
          Certificates
        </a>
        <a
          href="/theme-builder"
          class={`segmented-item whitespace-nowrap ${isCurrent("/theme-builder") ? "surface-strong shadow-sm text-[color:var(--text)]" : ""}`.trim()}
        >
          Theme Builder
        </a>
      </nav>
    </div>
  </div>
</header>
