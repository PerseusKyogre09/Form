<script lang="ts">
  import { page } from "$app/stores";
  import favicon from "$lib/assets/favicon.svg";
  import heroImage from "$lib/assets/demo/hero.png";
  import quillScreenshot from "$lib/assets/demo/quill.png";
  import Surface from "$lib/components/ui/Surface.svelte";

  const user = $derived($page.data.user);

  const features = [
    {
      title: "Focused builder",
      description: "Draft forms with questions, content blocks, themes, and sharing controls in one editing flow.",
    },
    {
      title: "Response operations",
      description: "Review submissions, export CSV, manage check-in, and keep form metadata close at hand.",
    },
    {
      title: "Team ready",
      description: "Share forms with collaborators, publish public links, and route people into polished thank-you pages.",
    },
  ];
</script>

<svelte:head>
  <title>Quill</title>
  <meta
    name="description"
    content="Quill is a form platform for building, publishing, and reviewing forms with a calmer, more deliberate workflow."
  />
</svelte:head>

<div class="app-shell">
  <header class="app-topbar">
    <div class="page-container flex h-16 items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <img src={favicon} alt="Quill" class="h-7 w-7 rounded-[8px]" />
        <div>
          <p class="text-sm font-semibold tracking-tight text-[color:var(--text)]">Quill</p>
          <p class="hidden text-xs muted sm:block">Forms with structure, not noise</p>
        </div>
      </div>

      <nav class="flex items-center gap-2">
        <a href="/certificate-generator" class="btn btn-ghost">Certificates</a>
        {#if user}
          <a href="/dashboard" class="btn btn-secondary">Open workspace</a>
        {:else}
          <a href="/login" class="btn btn-secondary">Log in</a>
          <a href="/login" class="btn btn-primary">Start a form</a>
        {/if}
      </nav>
    </div>
  </header>

  <main class="page-container page-stack section-stack">
    <section class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(420px,560px)] lg:items-center">
      <div class="space-y-6">
        <p class="eyebrow">Form platform</p>
        <div class="space-y-4">
          <h1 class="max-w-3xl text-[34px] font-semibold leading-tight tracking-tight text-[color:var(--text)] sm:text-[48px]">
            Build forms that feel deliberate from first draft to final response.
          </h1>
          <p class="max-w-2xl text-[15px] leading-7 muted sm:text-base">
            Quill combines form editing, response review, publishing, check-in, and post-submit flows in one workspace designed to stay clear under real use.
          </p>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row">
          <a href={user ? "/dashboard" : "/login"} class="btn btn-primary">
            {user ? "Open workspace" : "Create a form"}
          </a>
          <a href="/certificate-generator" class="btn btn-secondary">Try certificate generator</a>
        </div>
      </div>

      <Surface className="overflow-hidden">
        <img src={heroImage} alt="Quill form experience" class="h-full w-full object-cover" />
      </Surface>
    </section>

    <section class="grid gap-4 lg:grid-cols-3">
      {#each features as feature}
        <Surface className="panel-section">
          <h2 class="section-title">{feature.title}</h2>
          <p class="mt-2 text-sm leading-6 muted">{feature.description}</p>
        </Surface>
      {/each}
    </section>

    <section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Surface className="overflow-hidden">
        <img src={quillScreenshot} alt="Quill builder workspace" class="h-full w-full object-cover" />
      </Surface>
      <Surface className="panel-section section-stack">
        <div>
          <p class="eyebrow">Why it feels different</p>
          <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--text)]">Less marketing surface, more working surface.</h2>
        </div>
        <div class="space-y-4 text-sm leading-7 muted">
          <p>The builder keeps form structure, appearance, and sharing controls within reach instead of scattering them across disconnected screens.</p>
          <p>Public forms stay focused on completion, while response and check-in tools stay operational and dense enough for repeated work.</p>
          <p>The result is a product that feels calmer to use over time, not just impressive on first glance.</p>
        </div>
      </Surface>
    </section>
  </main>
</div>
