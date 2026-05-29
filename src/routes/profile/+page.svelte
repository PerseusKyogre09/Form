<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { authClient } from "$lib/authClient";
  import { goto } from "$app/navigation";
  import DashboardHeader from "$lib/components/DashboardHeader.svelte";
  import EmptyState from "$lib/components/ui/EmptyState.svelte";
  import PageHeader from "$lib/components/ui/PageHeader.svelte";
  import Surface from "$lib/components/ui/Surface.svelte";
  import { themePreference as themeStore, applyTheme } from "$lib/stores/theme";

  let loading = true;
  let saving = false;
  let username = "";
  let displayName = "";
  let bio = "";
  let location = "";
  let website = "";
  let avatarUrl = "";
  let twitterUrl = "";
  let linkedinUrl = "";
  let githubUrl = "";
  let themePreference = "light";
  let message = "";
  let error = "";
  let user: any = null;
  let avatarFile: File | null = null;
  let avatarPreview = "";

  $: themePreference = $themeStore;

  function handleThemeChange() {
    themeStore.set(themePreference as "light" | "dark" | "auto");
    applyTheme(themePreference as "light" | "dark" | "auto");
  }

  onMount(async () => {
    const { data: session } = await authClient.getSession();
    if (!session?.user) {
      goto("/login");
      return;
    }
    user = session.user;
    await loadProfile();
  });

  async function loadProfile() {
    try {
      loading = true;
      error = "";
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to load profile");
      const { profile } = await res.json();

      if (profile) {
        username = profile.username || "";
        displayName = profile.display_name || profile.name || "";
        bio = profile.bio || "";
        location = profile.location || "";
        website = profile.website || "";
        twitterUrl = profile.twitter_url || "";
        linkedinUrl = profile.linkedin_url || "";
        githubUrl = profile.github_url || "";
        themePreference = profile.theme_preference || "light";
        avatarUrl = profile.image || "";
        avatarPreview = avatarUrl;
      }
    } catch (e: any) {
      console.error("Error loading profile:", e);
      error = e.message;
    } finally {
      loading = false;
    }
  }

  function handleAvatarChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    avatarFile = file;
    const reader = new FileReader();
    reader.onload = (event) => {
      avatarPreview = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function updateProfile() {
    try {
      saving = true;
      message = "";
      error = "";

      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        formData.append(
          "path",
          `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        );

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          throw new Error(data.error || "Failed to upload avatar");
        }

        const { url } = await uploadRes.json();
        newAvatarUrl = url;
      }

      const updates = {
        username,
        display_name: displayName,
        bio,
        location,
        website,
        avatar_url: newAvatarUrl,
        twitter_url: twitterUrl,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
        theme_preference: themePreference,
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      avatarUrl = newAvatarUrl;
      avatarFile = null;
      message = "Profile updated successfully.";
      setTimeout(() => (message = ""), 3000);
    } catch (e: any) {
      console.error("Error updating profile:", e);
      error = e.message;
    } finally {
      saving = false;
    }
  }
</script>

<div class="app-shell">
  <DashboardHeader />

  <main class="page-container page-stack section-stack">
    <PageHeader
      eyebrow="Account"
      title="Profile"
      description="Manage your public details, links, and interface preferences."
    />

    {#if loading}
      <Surface className="panel-section">
        <div class="flex flex-col items-center justify-center py-20">
          <div class="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--border)] border-t-[color:var(--accent)]"></div>
          <p class="mt-3 text-sm muted">Loading profile…</p>
        </div>
      </Surface>
    {:else if !user}
      <EmptyState icon="fa-user" title="No session found" description="Sign in again to view your profile." />
    {:else}
      <div class="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Surface className="panel-section h-fit">
          <div class="flex flex-col items-start gap-5">
            <div class="relative">
              <div class="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[14px] border bg-[color:var(--surface-muted)] text-3xl font-semibold text-[color:var(--text)]">
                {#if avatarPreview}
                  <img src={avatarPreview} alt="Avatar preview" class="h-full w-full object-cover" />
                {:else}
                  {displayName ? displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
                {/if}
              </div>
              <label for="avatar-input" class="btn btn-secondary btn-sm absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                Change
              </label>
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                class="hidden"
                on:change={handleAvatarChange}
              />
            </div>

            <div class="space-y-1">
              <h2 class="text-xl font-semibold tracking-tight text-[color:var(--text)]">
                {displayName || user?.email?.split("@")[0] || "Welcome"}
              </h2>
              <p class="text-sm muted">{user.email}</p>
              <p class="text-sm muted-soft">
                {username ? `quill.geekroom-srmist.co.in/form/${username}` : "Set a username for a public form path"}
              </p>
            </div>
          </div>
        </Surface>

        <form
          class="section-stack"
          on:submit={(e) => {
            e.preventDefault();
            updateProfile();
          }}
        >
          <Surface className="panel-section section-stack">
            <div>
              <h3 class="section-title">Basic information</h3>
              <p class="mt-1 text-sm muted">How your identity appears inside the app and on public links.</p>
            </div>

            <div class="grid gap-5 md:grid-cols-2">
              <div>
                <label class="label" for="displayName">Display name</label>
                <input id="displayName" bind:value={displayName} type="text" class="field" placeholder="Your full name" />
                <p class="mt-1 text-xs muted-soft">Shown across your workspace.</p>
              </div>

              <div>
                <label class="label" for="username">Username</label>
                <input id="username" bind:value={username} type="text" class="field" placeholder="Choose a username" />
                {#if username}
                  <p class="mt-1 text-xs text-[color:var(--accent)]">quill.geekroom-srmist.co.in/form/{username}</p>
                {/if}
              </div>

              <div class="md:col-span-2">
                <label class="label" for="bio">Bio</label>
                <textarea id="bio" bind:value={bio} rows="4" class="textarea" placeholder="Tell people a little about yourself"></textarea>
                <p class="mt-1 text-xs muted-soft">{bio.length} / 500 characters</p>
              </div>

              <div>
                <label class="label" for="location">Location</label>
                <input id="location" bind:value={location} type="text" class="field" placeholder="City, country" />
              </div>

              <div>
                <label class="label" for="website">Website</label>
                <input id="website" bind:value={website} type="url" class="field" placeholder="https://example.com" />
              </div>
            </div>
          </Surface>

          <Surface className="panel-section section-stack">
            <div>
              <h3 class="section-title">Links</h3>
              <p class="mt-1 text-sm muted">Optional social and portfolio links.</p>
            </div>

            <div class="grid gap-5 md:grid-cols-3">
              <div>
                <label class="label" for="github">GitHub</label>
                <input id="github" bind:value={githubUrl} type="url" class="field" placeholder="https://github.com/username" />
              </div>
              <div>
                <label class="label" for="twitter">X</label>
                <input id="twitter" bind:value={twitterUrl} type="url" class="field" placeholder="https://x.com/username" />
              </div>
              <div>
                <label class="label" for="linkedin">LinkedIn</label>
                <input id="linkedin" bind:value={linkedinUrl} type="url" class="field" placeholder="https://linkedin.com/in/username" />
              </div>
            </div>
          </Surface>

          <Surface className="panel-section section-stack">
            <div>
              <h3 class="section-title">Preferences</h3>
              <p class="mt-1 text-sm muted">Choose how the workspace behaves on your device.</p>
            </div>

            <div class="max-w-sm">
              <label class="label" for="theme">Theme preference</label>
              <select id="theme" bind:value={themePreference} class="select" on:change={handleThemeChange}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
              <p class="mt-1 text-xs muted-soft">Auto follows your operating system setting.</p>
            </div>
          </Surface>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="submit" class="btn btn-primary" disabled={saving}>
              <i class="fas fa-save text-xs"></i>
              <span>{saving ? "Saving…" : "Save changes"}</span>
            </button>
            <button type="button" class="btn btn-secondary" disabled={saving} on:click={loadProfile}>
              Reset
            </button>
          </div>

          {#if message}
            <div transition:fade class="rounded-[10px] border px-4 py-3 text-sm" style="background: color-mix(in srgb, var(--success) 10%, var(--surface-strong)); border-color: color-mix(in srgb, var(--success) 20%, var(--border)); color: var(--success);">
              {message}
            </div>
          {/if}

          {#if error}
            <div transition:fade class="rounded-[10px] border px-4 py-3 text-sm" style="background: color-mix(in srgb, var(--danger) 10%, var(--surface-strong)); border-color: color-mix(in srgb, var(--danger) 20%, var(--border)); color: var(--danger);">
              {error}
            </div>
          {/if}
        </form>
      </div>
    {/if}
  </main>
</div>
