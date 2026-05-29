<script lang="ts">
  import { goto } from "$app/navigation";

  let { errorCode = 404, errorMessage = "Form not found" } = $props();

  let errorTitle = "Oops!";
  let errorDescription = "";
  let suggestedAction = "Go back to home";
  let iconColor = "red";
  let showGame = false;
  let gameScore = $state(0);
  let gameActive = $state(false);
  let gameTime = $state(5);
  let clickCount = $state(0);

  $effect.pre(() => {
    switch (errorCode) {
      case 404:
        errorTitle = "Form Not Found";
        errorDescription =
          errorMessage ||
          "The form you're looking for doesn't exist or has been removed.";
        iconColor = "red";
        showGame = true;
        break;
      case 410:
        errorTitle = "Form Closed";
        errorDescription =
          errorMessage || "This form is no longer accepting responses.";
        iconColor = "amber";
        showGame = false;
        break;
      case 500:
        errorTitle = "Something Went Wrong";
        errorDescription =
          "We encountered an error while loading the form. Please try again later.";
        iconColor = "red";
        showGame = false;
        break;
      default:
        errorTitle = "Error";
        errorDescription =
          errorMessage || "Something went wrong while loading the form.";
        iconColor = "red";
        showGame = false;
    }
  });

  async function handleGoHome() {
    await goto("/");
  }

  function startGame() {
    gameActive = true;
    gameScore = 0;
    clickCount = 0;
    gameTime = 5;

    const interval = setInterval(() => {
      gameTime--;
      if (gameTime <= 0) {
        gameActive = false;
        clearInterval(interval);
      }
    }, 1000);
  }

  function handleGameClick() {
    if (gameActive) {
      clickCount++;
      gameScore = clickCount;
    }
  }
</script>

<div class="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4">
  <div class="w-full max-w-lg animate-fade-in">
    <section class="rounded-[16px] border border-slate-200/80 bg-white/96 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 dark:border-gray-800 dark:bg-gray-900/96">
      <div class="mb-6 flex items-start gap-4">
        <div
          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border {iconColor === 'amber'
            ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300'
            : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300'}"
        >
          {#if errorCode === 410}
            <i class="fas fa-lock text-lg"></i>
          {:else}
            <i class="fas fa-circle-exclamation text-lg"></i>
          {/if}
        </div>

        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-gray-400">
            Error {errorCode}
          </p>
          <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {errorTitle}
          </h1>
          <p class="mt-3 text-sm leading-6 text-slate-600 dark:text-gray-300 sm:text-base">
            {errorDescription}
          </p>
        </div>
      </div>

      {#if showGame && errorCode === 404}
        <div class="mb-6 rounded-[14px] border border-slate-200 bg-slate-50 p-4 dark:border-gray-800 dark:bg-gray-950/40">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <p class="text-sm font-medium text-slate-900 dark:text-white">
                Quick tap test
              </p>
              <p class="text-xs text-slate-500 dark:text-gray-400">
                Optional. Five seconds, thumb-friendly.
              </p>
            </div>
            <div class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
              {gameActive ? `${gameTime}s` : `${gameScore} taps`}
            </div>
          </div>

          {#if !gameActive}
            <button
              on:click={startGame}
              class="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-gray-100"
            >
              {gameScore > 0 ? `Try again (${gameScore})` : "Start tap test"}
            </button>
          {:else}
            <div class="space-y-3">
              <div class="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                <span>Time left</span>
                <span class="font-semibold text-slate-900 dark:text-white">{gameTime}s</span>
              </div>
              <button
                on:click={handleGameClick}
                class="flex min-h-[88px] w-full items-center justify-center rounded-xl border border-[color:var(--accent)] bg-[color:var(--accent-soft)] px-4 py-6 text-lg font-semibold text-[color:var(--accent)] transition-transform active:scale-[0.99]"
              >
                Tap
              </button>
            </div>
          {/if}
        </div>
      {/if}

      <div class="flex flex-col gap-3 sm:flex-row">
        <button
          on:click={handleGoHome}
          class="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-gray-100"
        >
          <span>{suggestedAction}</span>
          <i class="fas fa-arrow-right text-xs"></i>
        </button>
      </div>

      <p class="mt-5 text-xs leading-5 text-slate-500 dark:text-gray-400">
        {#if errorCode === 410}
          Please contact the form owner if you think this form should still be accepting responses.
        {:else if errorCode === 404}
          Check the link and try again, or return to the home page.
        {:else}
          If the problem persists, contact the form owner and try again later.
        {/if}
      </p>
    </section>
  </div>
</div>

<style>
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slide-down {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes scale-in {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes bounce-slow {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-12px);
    }
  }

  @keyframes wiggle {
    0%,
    100% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(-5deg);
    }
    75% {
      transform: rotate(5deg);
    }
  }

  @keyframes spin-slow {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes float-1 {
    0%,
    100% {
      transform: translateY(0px) translateX(0px);
    }
    25% {
      transform: translateY(-20px) translateX(10px);
    }
    50% {
      transform: translateY(-30px) translateX(-10px);
    }
    75% {
      transform: translateY(-10px) translateX(15px);
    }
  }

  @keyframes float-2 {
    0%,
    100% {
      transform: translateY(0px) translateX(0px);
    }
    25% {
      transform: translateY(-15px) translateX(-12px);
    }
    50% {
      transform: translateY(-25px) translateX(8px);
    }
    75% {
      transform: translateY(-8px) translateX(-15px);
    }
  }

  @keyframes float-3 {
    0%,
    100% {
      transform: translateY(0px) translateX(0px);
    }
    25% {
      transform: translateY(-25px) translateX(-8px);
    }
    50% {
      transform: translateY(-35px) translateX(12px);
    }
    75% {
      transform: translateY(-12px) translateX(-10px);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.6s ease-out;
  }

  .animate-fade-in-delayed {
    animation: fade-in 0.6s ease-out 0.2s both;
  }

  .animate-fade-in-delayed-2 {
    animation: fade-in 0.6s ease-out 0.4s both;
  }

  .animate-fade-in-delayed-3 {
    animation: fade-in 0.6s ease-out 0.6s both;
  }

  .animate-fade-in-delayed-4 {
    animation: fade-in 0.6s ease-out 0.8s both;
  }

  .animate-slide-down {
    animation: slide-down 0.6s ease-out 0.1s both;
  }

  .animate-scale-in {
    animation: scale-in 0.5s ease-out 0.5s both;
  }

  .animate-bounce-slow {
    animation: bounce-slow 3s infinite;
  }

  .animate-wiggle {
    animation: wiggle 0.5s infinite;
  }

  .animate-spin-slow {
    animation: spin-slow 4s linear infinite;
  }

  .animate-float-1 {
    animation: float-1 6s ease-in-out infinite;
  }

  .animate-float-2 {
    animation: float-2 7s ease-in-out infinite;
  }

  .animate-float-3 {
    animation: float-3 8s ease-in-out infinite;
  }

  :global(body) {
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  }
</style>
