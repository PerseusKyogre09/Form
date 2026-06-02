<!-- src/lib/components/Footer.svelte -->
<script lang="ts">
  import favicon from "$lib/assets/favicon.svg";

  const currentYear = new Date().getFullYear();
  const maintainer = {
    name: "Pradeepto Pal",
    handle: "PerseusKyogre09",
    href: "https://github.com/PerseusKyogre09",
  };

  const productLinks = [
    { label: "Home", href: "/" },
    { label: "Workspace", href: "/dashboard" },
    { label: "Certificate Generator", href: "/certificate-generator" },
    {
      label: "Open Source",
      href: "https://github.com/PerseusKyogre09/Form",
      external: true,
    },
  ];

  const legalLinks = [
    { label: "Terms of Service", href: "/terms?tab=terms" },
    { label: "Privacy Policy", href: "/terms?tab=privacy" },
    { label: "Security & Abuse", href: "/terms?tab=privacy#priv-tracking" },
  ];

  const communityLinks = [
    {
      label: "geekroom-srmist.co.in",
      href: "https://www.geekroom-srmist.co.in",
      external: true,
    },
    {
      label: "Geek Room SRMIST on LinkedIn",
      href: "https://www.linkedin.com/company/geek-room-srmist",
      external: true,
    },
    {
      label: "GitHub",
      href: "https://github.com/geekroomtechnical",
      external: true,
    },
    {
      label: "X / Twitter",
      href: "https://x.com/GeekroomSRMIST",
      external: true,
    },
  ];
</script>

<footer
  class="border-t border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)]"
>
  <div class="page-container py-10 sm:py-12">
    <div class="grid gap-8 lg:grid-cols-[1.2fr_0.9fr_0.9fr]">
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <img src={favicon} alt="Quill" class="h-7 w-7 rounded-[8px]" />
          <div>
            <p class="text-sm font-semibold tracking-tight">Quill</p>
            <p class="text-xs muted-soft">Forms with calm structure</p>
          </div>
        </div>

        <p class="max-w-md text-sm leading-6 muted">
          A deliberate forms platform for building, sharing, and reviewing
          responses with less friction and more clarity.
        </p>

        <div class="flex flex-wrap gap-2 text-xs">
          <span class="status-badge badge-muted">Accessible</span>
          <span class="status-badge badge-muted">Responsive</span>
          <span class="status-badge badge-muted">Privacy-aware</span>
        </div>

        <div
          class="surface-elevated rounded-[12px] border border-[color:var(--border)] p-4 text-sm"
        >
          <p
            class="text-xs font-semibold uppercase tracking-[0.08em] muted-soft"
          >
            Maintained by
          </p>
          <p class="mt-2 leading-6 muted">
            Developed and maintained by
            <a
              href={maintainer.href}
              target="_blank"
              rel="noopener noreferrer"
              class="font-semibold text-[color:var(--text)] transition-colors hover:text-[color:var(--accent)]"
            >
              {maintainer.name}
            </a>
            ({maintainer.handle}).
          </p>
        </div>
      </div>

      <nav aria-label="Product links" class="space-y-3">
        <p class="eyebrow">Product</p>
        <ul class="space-y-2 text-sm">
          {#each productLinks as link}
            <li>
              <a
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                class="inline-flex items-center gap-2 text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text)]"
              >
                <i class="fas fa-arrow-right text-[10px] opacity-60"></i>
                <span>{link.label}</span>
              </a>
            </li>
          {/each}
        </ul>
      </nav>

      <nav aria-label="Legal and community links" class="space-y-3">
        <p class="eyebrow">Legal & Community</p>
        <ul class="space-y-2 text-sm">
          {#each legalLinks as link}
            <li>
              <a
                href={link.href}
                class="inline-flex items-center gap-2 text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text)]"
              >
                <i class="fas fa-shield-halved text-[10px] opacity-60"></i>
                <span>{link.label}</span>
              </a>
            </li>
          {/each}
          {#each communityLinks as link}
            <li>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text)]"
              >
                <i class="fas fa-link text-[10px] opacity-60"></i>
                <span>{link.label}</span>
              </a>
            </li>
          {/each}
        </ul>
      </nav>
    </div>

    <div
      class="mt-8 flex flex-col gap-3 border-t border-[color:var(--border)] pt-5 text-xs muted-soft sm:flex-row sm:items-center sm:justify-between"
    >
      <p>&copy; {currentYear} Quill. All rights reserved.</p>
      <p>Built with love by PerseusKyogre09</p>
    </div>
  </div>
</footer>
