<!-- src/lib/components/NotificationContainer.svelte -->
<script lang="ts">
  import { notifications } from '../stores/notifications';
  import { gsap } from 'gsap';
  import { tick } from 'svelte';

  let notificationRefs: { [key: string]: HTMLElement } = {};

  function getBackgroundColor(type: string) {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  }

  function getIcon(type: string) {
    switch (type) {
      case 'success':
        return 'fa-check-circle';
      case 'error':
        return 'fa-exclamation-circle';
      default:
        return 'fa-info-circle';
    }
  }

  async function handleElementMount(id: string) {
    await tick();
    const el = notificationRefs[id];
    if (el) {
      gsap.fromTo(
        el,
        { 
          opacity: 0, 
          x: 500, 
          rotationZ: 10,
          scale: 0.8
        },
        { 
          opacity: 1, 
          x: 0, 
          rotationZ: 0,
          scale: 1,
          duration: 0.4, 
          ease: 'cubic.out'
        }
      );
    }
  }

  function handleRemove(id: string) {
    const el = notificationRefs[id];
    if (el) {
      gsap.to(el, {
        opacity: 0,
        x: 500,
        rotationZ: 10,
        scale: 0.8,
        duration: 0.35,
        ease: 'cubic.in',
        onComplete: () => {
          notifications.remove(id);
        }
      });
    }
  }

  $: {
    // Trigger animation when notifications change
    $notifications.forEach(notification => {
      handleElementMount(notification.id);
    });
  }
</script>

<div class="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
  {#each $notifications as notification (notification.id)}
    <div
      bind:this={notificationRefs[notification.id]}
      class="flex items-center gap-3 px-5 py-4 {getBackgroundColor(notification.type)} text-white rounded-lg shadow-2xl pointer-events-auto backdrop-blur-sm border border-white/10"
    >
      <i class="fas {getIcon(notification.type)} text-lg animate-pulse"></i>
      <span class="text-sm font-medium">{notification.message}</span>
      <button 
        on:click={() => handleRemove(notification.id)}
        class="ml-2 hover:bg-white/20 p-1 rounded transition-all"
        aria-label="Close notification"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
      </button>
    </div>
  {/each}
</div>

<style>
  :global(.animate-pulse) {
    animation: pulse-glow 2s ease-in-out infinite;
  }
  
  @keyframes pulse-glow {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
</style>
