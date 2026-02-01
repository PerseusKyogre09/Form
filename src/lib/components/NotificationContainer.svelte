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
        { opacity: 0, x: 400 },
        { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
      );
    }
  }

  function handleRemove(id: string) {
    const el = notificationRefs[id];
    if (el) {
      gsap.to(el, {
        opacity: 0,
        x: 400,
        duration: 0.3,
        ease: 'power2.in',
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
      class="flex items-center gap-3 px-4 py-3 {getBackgroundColor(notification.type)} text-white rounded-lg shadow-lg pointer-events-auto"
    >
      <i class="fas {getIcon(notification.type)} text-lg"></i>
      <span class="text-sm font-medium">{notification.message}</span>
    </div>
  {/each}
</div>

<style>
  :global(.animate-pulse-slow) {
    animation: pulse-slow 0.3s ease-out;
  }
  
  @keyframes pulse-slow {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
</style>
