<script lang="ts">
  import type { ThankYouPage } from '../types';

  export let thankYouPage: ThankYouPage | undefined;

  // Fallback to empty state if undefined
  const config = thankYouPage || {
    enabled: false,
    title: '',
    subtitle: '',
    backgroundType: 'color',
    backgroundColor: '#ffffff',
    buttons: [],
    socialLinks: [],
    showSuccessIcon: true,
    showFormInfo: true
  };

  const socialPlatforms: Record<string, { name: string; icon: string }> = {
    instagram: { name: 'Instagram', icon: 'fab fa-instagram' },
    twitter: { name: 'Twitter/X', icon: 'fab fa-twitter' },
    facebook: { name: 'Facebook', icon: 'fab fa-facebook' },
    linkedin: { name: 'LinkedIn', icon: 'fab fa-linkedin' },
    youtube: { name: 'YouTube', icon: 'fab fa-youtube' },
    tiktok: { name: 'TikTok', icon: 'fab fa-tiktok' }
  };
</script>

<div
  class="min-h-screen flex items-center justify-center p-4 transition-colors"
  style="background-color: {config.backgroundType === 'color' ? config.backgroundColor : '#ffffff'};"
>
  {#if config.enabled && (config.title || config.subtitle || config.buttons.length > 0)}
    <div class="text-center max-w-md">
      {#if config.showSuccessIcon}
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
          style="background-color: rgba(34,197,94,0.2);"
        >
          <svg class="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      {/if}

      {#if config.title}
        <h1 class="text-4xl font-bold mb-2 text-slate-900">{config.title}</h1>
      {/if}

      {#if config.subtitle}
        <p class="text-lg text-slate-600 mb-6">{config.subtitle}</p>
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
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              }`}
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
                class="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
                title={socialPlatforms[link.platform]?.name}
              >
                <i class={socialPlatforms[link.platform]?.icon}></i>
              </a>
            {/if}
          {/each}
        </div>
      {/if}

      {#if config.showFormInfo}
        <p class="text-sm text-slate-500 mt-6">
          <slot name="form-info" />
        </p>
      {/if}
    </div>
  {/if}
</div>

<style>
  :global(a) {
    transition: all 0.3s ease;
  }
</style>
