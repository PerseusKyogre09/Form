<script lang="ts">
  import type { ThankYouPage } from '../types';

  export let config: ThankYouPage | undefined;
  export let formInfo: string = '';

  // Determine if we should show custom or fallback
  const isCustomized = config?.enabled && (config.title || config.subtitle || config.buttons.length > 0);

  const socialPlatforms: Record<string, { name: string; icon: string }> = {
    instagram: { name: 'Instagram', icon: 'fab fa-instagram' },
    twitter: { name: 'Twitter/X', icon: 'fab fa-twitter' },
    facebook: { name: 'Facebook', icon: 'fab fa-facebook' },
    linkedin: { name: 'LinkedIn', icon: 'fab fa-linkedin' },
    youtube: { name: 'YouTube', icon: 'fab fa-youtube' },
    tiktok: { name: 'TikTok', icon: 'fab fa-tiktok' }
  };
</script>

{#if isCustomized && config}
  <div
    class="min-h-screen flex items-center justify-center p-4 transition-colors w-full"
    style="background-color: {config.backgroundType === 'color' ? config.backgroundColor : '#ffffff'};"
  >
    <div class="text-center w-full max-w-2xl">
      {#if config.showSuccessIcon}
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
          style="background-color: {config.successIconColor ? `rgba(${parseInt(config.successIconColor.slice(1,3), 16)},${parseInt(config.successIconColor.slice(3,5), 16)},${parseInt(config.successIconColor.slice(5,7), 16)},0.2)` : 'rgba(34,197,94,0.2)'};"
        >
          <svg 
            class="w-8 h-8" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            style="color: {config.successIconColor || '#22c55e'};"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      {/if}

      {#if config.title}
        <h1 
          class="text-4xl font-bold mb-2"
          style="color: {config.titleColor || '#1f2937'};"
        >
          {config.title}
        </h1>
      {/if}

      {#if config.subtitle}
        <p 
          class="text-lg mb-6"
          style="color: {config.subtitleColor || '#6b7280'};"
        >
          {config.subtitle}
        </p>
      {/if}

      {#if config.buttons.length > 0}
        <div class="space-y-3 mb-6">
          {#each config.buttons as button}
            <a
              href={button.url}
              target="_blank"
              rel="noopener noreferrer"
              class={`block px-6 py-3 rounded-lg font-medium transition-colors ${
                button.variant === 'primary'
                  ? 'hover:opacity-90'
                  : 'hover:opacity-80'
              }`}
              style={button.variant === 'primary'
                ? `background-color: ${config.titleColor || '#1f2937'}; color: white;`
                : `background-color: rgba(${parseInt((config.titleColor || '#1f2937').slice(1,3), 16)},${parseInt((config.titleColor || '#1f2937').slice(3,5), 16)},${parseInt((config.titleColor || '#1f2937').slice(5,7), 16)},0.1); color: ${config.titleColor || '#1f2937'};`}
            >
              {button.label}
            </a>
          {/each}
        </div>
      {/if}

      {#if config.socialLinks.length > 0}
        <div class="flex justify-center gap-4 mb-6">
          {#each config.socialLinks as link}
            {#if link.url}
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                class="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style="background-color: {config.titleColor ? `rgba(${parseInt(config.titleColor.slice(1,3), 16)},${parseInt(config.titleColor.slice(3,5), 16)},${parseInt(config.titleColor.slice(5,7), 16)},0.1)` : 'rgba(31,41,55,0.1)'}; color: {config.titleColor || '#1f2937'};"
                title={socialPlatforms[link.platform]?.name}
              >
                <i class={socialPlatforms[link.platform]?.icon}></i>
              </a>
            {/if}
          {/each}
        </div>
      {/if}

      {#if config.showFormInfo && formInfo}
        <p 
          class="text-sm mt-6"
          style="color: {config.textColor || '#d1d5db'};"
        >
          {formInfo}
        </p>
      {/if}
    </div>
  </div>
{:else}
  <!-- Fallback to default design -->
  <slot name="fallback" />
{/if}

<style>
  :global(a) {
    transition: all 0.3s ease;
  }
</style>
