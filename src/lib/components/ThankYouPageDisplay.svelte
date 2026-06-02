<script lang="ts">
  import type { ThankYouPage } from "../types";

  export let config: ThankYouPage | undefined;
  export let formInfo = "";

  const isCustomized =
    config?.enabled &&
    (config.title || config.subtitle || config.buttons.length > 0);

  const socialPlatforms: Record<string, { name: string; icon: string }> = {
    instagram: { name: "Instagram", icon: "fab fa-instagram" },
    twitter: { name: "Twitter/X", icon: "fab fa-twitter" },
    facebook: { name: "Facebook", icon: "fab fa-facebook" },
    linkedin: { name: "LinkedIn", icon: "fab fa-linkedin" },
    youtube: { name: "YouTube", icon: "fab fa-youtube" },
    tiktok: { name: "TikTok", icon: "fab fa-tiktok" },
  };

  function alphaColor(hex: string | undefined, alpha = 0.12) {
    if (!hex?.startsWith("#") || hex.length !== 7) return "";
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
</script>

{#if isCustomized && config}
  <div
    class="flex min-h-screen w-full items-center justify-center p-4"
    style={`background-color:${config.backgroundType === "color" ? config.backgroundColor : "var(--bg-canvas)"}; background-image:${config.backgroundType === "image" && config.backgroundImage ? `url('${config.backgroundImage}')` : "none"}; background-size:cover; background-position:center;`}
  >
    <div
      class="w-full max-w-2xl rounded-[14px] border px-6 py-10 text-center shadow-sm sm:px-10 surface-elevated"
      style={`background:${alphaColor(config.backgroundColor, 0.82) || "var(--surface-elevated)"}; border-color:${alphaColor(config.textColor || config.titleColor, 0.14) || "var(--border)"}; color:${config.textColor || "var(--text)"}; backdrop-filter: blur(8px);`}
    >
      {#if config.showSuccessIcon}
        <div
          class="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border"
          style={`background:${alphaColor(config.successIconColor || config.titleColor, 0.14) || "color-mix(in srgb, var(--success) 12%, var(--surface-elevated))"}; color:${config.successIconColor || config.titleColor || "var(--success)"}; border-color:${alphaColor(config.successIconColor || config.titleColor, 0.14) || "var(--border)"};`}
        >
          <svg class="h-7 w-7" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      {/if}

      {#if config.title}
        <h1 class="text-[32px] font-semibold tracking-tight" style={`color:${config.titleColor || config.textColor || "var(--text)"};`}>
          {config.title}
        </h1>
      {/if}

      {#if config.subtitle}
        <p class="mx-auto mt-3 max-w-xl text-base leading-7" style={`color:${config.subtitleColor || config.textColor || "var(--text-muted)"};`}>
          {config.subtitle}
        </p>
      {/if}

      {#if config.buttons.length > 0}
        <div class="mt-8 space-y-3">
          {#each config.buttons as button}
            <a
              href={button.url}
              target="_blank"
              rel="noopener noreferrer"
              class="block rounded-[10px] border px-5 py-3 text-sm font-medium transition-colors"
              style={button.variant === "primary"
                ? `background:${config.titleColor || "var(--text)"}; border-color:${config.titleColor || "var(--text)"}; color:var(--surface-strong);`
                : `background:${alphaColor(config.titleColor, 0.08) || "var(--surface-muted)"}; border-color:${alphaColor(config.titleColor, 0.14) || "var(--border)"}; color:${config.titleColor || config.textColor || "var(--text)"};`}
            >
              {button.label}
            </a>
          {/each}
        </div>
      {/if}

      {#if config.socialLinks.length > 0}
        <div class="mt-8 flex justify-center gap-3">
          {#each config.socialLinks as link}
            {#if link.url}
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                class="flex h-10 w-10 items-center justify-center rounded-full border"
                style={`background:${alphaColor(config.titleColor, 0.08) || "var(--surface-muted)"}; border-color:${alphaColor(config.titleColor, 0.14) || "var(--border)"}; color:${config.titleColor || config.textColor || "var(--text)"};`}
                title={socialPlatforms[link.platform]?.name}
              >
                <i class={socialPlatforms[link.platform]?.icon}></i>
              </a>
            {/if}
          {/each}
        </div>
      {/if}

      {#if config.showFormInfo && formInfo}
        <p class="mt-8 text-sm" style={`color:${config.textColor || config.subtitleColor || "var(--text-soft)"};`}>
          {formInfo}
        </p>
      {/if}
    </div>
  </div>
{:else}
  <slot name="fallback" />
{/if}
