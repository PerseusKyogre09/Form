<!-- src/lib/components/Footer.svelte -->
<script lang="ts">
  import favicon from "$lib/assets/favicon.svg";
  import { page } from "$app/stores";

  // Current year for the copyright notice
  const currentYear = new Date().getFullYear();

  // Developer/Maintainer socials
  const maintainerSocials = [
    {
      name: "GitHub",
      url: "https://github.com/PerseusKyogre09",
      icon: "fab fa-github",
    },
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/pradeeptopal",
      icon: "fab fa-linkedin",
    },
    {
      name: "X (Twitter)",
      url: "https://x.com/KyogrePerseus",
      icon: "fab fa-x-twitter",
    },
  ];

  // Geek Room SRMIST community supporter socials
  const communitySocials = [
    {
      name: "Website",
      url: "https://www.geekroom-srmist.co.in",
      icon: "fas fa-globe",
      label: "Geekroom SRMIST",
    },
    {
      name: "GitHub",
      url: "https://github.com/geekroomtechnical",
      icon: "fab fa-github",
      label: "geekroomtechnical",
    },
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/company/geek-room-srmist",
      icon: "fab fa-linkedin",
      label: "geek-room-srmist",
    },
    {
      name: "X (Twitter)",
      url: "https://x.com/GeekroomSRMIST",
      icon: "fab fa-x-twitter",
      label: "GeekroomSRMIST",
    },
    {
      name: "Instagram",
      url: "https://instagram.com/GEEKROOM_SRM_GHZ",
      icon: "fab fa-instagram",
      label: "GEEKROOM_SRM_GHZ",
    },
  ];
</script>

<footer
  class="relative overflow-hidden border-t border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] transition-colors duration-150 py-12 md:py-16 mt-auto"
>
  <!-- Subtle decorative light/dark color gradient glow in the background of the footer -->
  <div
    class="absolute inset-0 pointer-events-none opacity-50 dark:opacity-20 z-0"
  >
    <div
      class="absolute -bottom-24 -left-20 w-96 h-96 rounded-full bg-gradient-to-tr from-[color:var(--accent-soft)] to-transparent blur-[80px]"
    ></div>
    <div
      class="absolute -top-24 right-10 w-80 h-80 rounded-full bg-gradient-to-bl from-[color:var(--accent-soft)] to-transparent blur-[80px]"
    ></div>
  </div>

  <div class="page-container relative z-10">
    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-12 pb-12 border-b border-[color:var(--border)]"
    >
      <!-- Brand & Community Info Section (Takes up 5/12 grid spaces on desktop) -->
      <div class="lg:col-span-5 flex flex-col space-y-5">
        <div class="flex items-center gap-3">
          <img
            src={favicon}
            alt="Quill"
            class="h-7 w-7 rounded-[8px] hover:rotate-12 transition-transform duration-300 shadow-sm"
          />
          <div>
            <p
              class="text-base font-bold tracking-tight text-[color:var(--text)]"
            >
              Quill
            </p>
            <p class="text-xs muted-soft font-semibold">
              Forms with structure, not noise
            </p>
          </div>
        </div>

        <p
          class="text-sm text-[color:var(--text-muted)] leading-relaxed max-w-sm"
        >
          Quill is a calm, deliberate forms platform designed to help you build,
          share, and analyze submissions without clutter.
        </p>

        <!-- Maintainer Info Box -->
        <div
          class="p-4 rounded-[12px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] max-w-sm space-y-3.5 transition-all hover:border-[color:var(--border-strong)]"
        >
          <div>
            <p
              class="text-xs font-bold uppercase tracking-wider text-[color:var(--accent)] flex items-center gap-1.5"
            >
              <i class="fas fa-user-gear"></i> Maintained By
            </p>
            <p
              class="text-xs leading-relaxed text-[color:var(--text-muted)] mt-1.5"
            >
              Developed and solely maintained by <strong>Pradeepto</strong> (<a
                href="https://github.com/PerseusKyogre09"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:underline text-[color:var(--text)] font-semibold"
                >PerseusKyogre09</a
              >).
            </p>
            <!-- Maintainer Socials -->
            <div class="flex items-center gap-3.5 mt-2.5">
              {#each maintainerSocials as social}
                <a
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-[color:var(--text-soft)] hover:text-[color:var(--accent)] transition-colors text-xs flex items-center gap-1"
                  title={`${social.name} (Pradeepto)`}
                >
                  <i class={social.icon}></i>
                  <span class="text-[10px] font-bold">{social.name}</span>
                </a>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <!-- Links Columns (Takes up 7/12 spaces on desktop) -->
      <div class="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
        <!-- Product Link Column -->
        <div class="flex flex-col space-y-4">
          <p class="text-xs font-bold uppercase tracking-wider muted-soft">
            Product
          </p>
          <ul class="flex flex-col space-y-2.5 text-sm font-semibold">
            <li>
              <a
                href="/"
                class="text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition-colors flex items-center gap-1.5 group"
              >
                <i
                  class="fas fa-house text-xs opacity-70 group-hover:translate-x-0.5 transition-transform"
                ></i>
                Home
              </a>
            </li>
            <li>
              <a
                href="/dashboard"
                class="text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition-colors flex items-center gap-1.5 group"
              >
                <i
                  class="fas fa-table-cells-large text-xs opacity-70 group-hover:translate-x-0.5 transition-transform"
                ></i>
                Workspace
              </a>
            </li>
            <li>
              <a
                href="/certificate-generator"
                class="text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition-colors flex items-center gap-1.5 group"
              >
                <i
                  class="fas fa-certificate text-xs opacity-70 group-hover:translate-x-0.5 transition-transform"
                ></i>
                Certificates
              </a>
            </li>
            <li>
              <a
                href="https://github.com/PerseusKyogre09/Form"
                target="_blank"
                rel="noopener noreferrer"
                class="text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition-colors flex items-center gap-1.5 group"
              >
                <i
                  class="fas fa-code-branch text-xs opacity-70 group-hover:translate-x-0.5 transition-transform"
                ></i>
                Open Source
              </a>
            </li>
          </ul>
        </div>

        <!-- Legal Link Column -->
        <div class="flex flex-col space-y-4">
          <p class="text-xs font-bold uppercase tracking-wider muted-soft">
            Legal & Trust
          </p>
          <ul class="flex flex-col space-y-2.5 text-sm font-semibold">
            <li>
              <a
                href="/terms?tab=terms"
                class="text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition-colors flex items-center gap-1.5 group"
              >
                <i
                  class="fas fa-scale-balanced text-xs opacity-70 group-hover:translate-x-0.5 transition-transform"
                ></i>
                Terms of Service
              </a>
            </li>
            <li>
              <a
                href="/terms?tab=privacy"
                class="text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition-colors flex items-center gap-1.5 group"
              >
                <i
                  class="fas fa-shield-halved text-xs opacity-70 group-hover:translate-x-0.5 transition-transform"
                ></i>
                Privacy Policy
              </a>
            </li>
            <li>
              <a
                href="/terms?tab=privacy#priv-tracking"
                class="text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition-colors flex items-center gap-1.5 group"
              >
                <i
                  class="fas fa-cookie text-xs opacity-70 group-hover:translate-x-0.5 transition-transform"
                ></i>
                Spam & Cookies
              </a>
            </li>
            <li>
              <a
                href="/terms?tab=privacy#priv-regional-rights"
                class="text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition-colors flex items-center gap-1.5 group"
              >
                <i
                  class="fas fa-globe-asia text-xs opacity-70 group-hover:translate-x-0.5 transition-transform"
                ></i>
                GDPR & DPDP Hub
              </a>
            </li>
          </ul>
        </div>

        <!-- Supporter Column -->
        <div class="flex flex-col space-y-4 col-span-2 sm:col-span-1">
          <div>
            <p class="text-xs font-bold uppercase tracking-wider muted-soft">
              Supporter & Patron
            </p>
            <p
              class="text-[11px] leading-relaxed text-[color:var(--text-soft)] mt-1.5 font-semibold"
            >
              Geekroom SRMIST generously supports Quill by patronizing our
              custom domain.
            </p>
          </div>
          <ul class="flex flex-col space-y-2.5 text-sm font-semibold">
            {#each communitySocials as social}
              <li>
                <a
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition-colors flex items-center gap-1.5 group"
                >
                  <i
                    class={`${social.icon} text-xs opacity-70 group-hover:translate-x-0.5 transition-transform`}
                  ></i>
                  <span class="truncate"
                    >{social.name === "Website"
                      ? "Geekroom Web"
                      : social.label}</span
                  >
                  {#if social.name === "Website"}
                    <i
                      class="fas fa-up-right-from-square text-[10px] muted-soft opacity-50 group-hover:opacity-100 transition-opacity"
                    ></i>
                  {/if}
                </a>
              </li>
            {/each}
            <li>
              <a
                href="mailto:contact@geekroom-srmist.co.in"
                class="text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition-colors flex items-center gap-1.5 group border-t border-[color:var(--border)] pt-2.5 mt-1"
              >
                <i
                  class="fas fa-envelope text-xs opacity-70 group-hover:translate-x-0.5 transition-transform"
                ></i>
                Email Support
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Bottom Copyright and Theme Indication Row -->
    <div
      class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs font-semibold muted-soft"
    >
      <div
        class="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 text-center sm:text-left"
      >
        <p>&copy; {currentYear} Quill Form. Licensed under MIT.</p>
        <span class="hidden sm:inline text-gray-300 dark:text-gray-700">|</span>
        <a
          href="https://www.geekroom-srmist.co.in"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-[color:var(--text)] transition-colors flex items-center gap-1"
        >
          Supporter: Geekroom SRMIST
          <i class="fas fa-heart text-indigo-500"></i>
        </a>
      </div>

      <div class="flex items-center gap-2">
        <span
          class="flex h-2 w-2 rounded-full bg-emerald-500 shadow-sm animate-pulse"
        ></span>
        <p>Operational Global Serverless Platform</p>
      </div>
    </div>
  </div>
</footer>
