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

<div
  class="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4 overflow-hidden relative"
>
  <!-- Dynamic Background Gradient Animation -->
  <div class="absolute inset-0 z-0">
    <div
      class="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-900 dark:to-gray-950 opacity-50"
    ></div>
    <div
      class="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-50 animate-blob"
    ></div>
    <div
      class="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-100 dark:bg-purple-900/20 rounded-full blur-3xl opacity-50 animate-blob animation-delay-2000"
    ></div>
    <div
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-pink-100 dark:bg-pink-900/20 rounded-full blur-3xl opacity-50 animate-blob animation-delay-4000"
    ></div>
  </div>

  <div class="w-full max-w-md animate-fade-in relative z-10">
    <!-- Error Card -->
    <div
      class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-800/50 p-8 text-center relative overflow-hidden"
    >
      <!-- Decorative Top Gradient Line -->
      <div
        class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r {errorCode ===
        410
          ? 'from-amber-400 to-orange-500'
          : 'from-red-400 to-pink-500'}"
      ></div>
      <!-- Animated Floating Particles (for 404 only) -->
      {#if errorCode === 404}
        <div
          class="absolute top-0 left-4 w-2 h-2 bg-red-300 rounded-full animate-float-1 opacity-60"
        ></div>
        <div
          class="absolute top-8 right-6 w-3 h-3 bg-blue-300 rounded-full animate-float-2 opacity-50"
        ></div>
        <div
          class="absolute bottom-20 left-8 w-2 h-2 bg-purple-300 rounded-full animate-float-3 opacity-60"
        ></div>
      {/if}

      <!-- Error Icon with Animation -->
      <div class="mb-8 relative inline-block">
        <div
          class="absolute inset-0 {iconColor === 'amber'
            ? 'bg-amber-100 dark:bg-amber-900/40'
            : 'bg-red-100 dark:bg-red-900/40'} rounded-full animate-ping opacity-30"
        ></div>
        <div
          class="absolute inset-0 {iconColor === 'amber'
            ? 'bg-amber-200 dark:bg-amber-800/40'
            : 'bg-red-200 dark:bg-red-800/40'} rounded-full animate-pulse opacity-50 scale-125"
        ></div>
        <div
          class="w-20 h-20 {iconColor === 'amber'
            ? 'bg-amber-100 dark:bg-amber-900/60'
            : 'bg-red-100 dark:bg-red-900/60'} rounded-full flex items-center justify-center relative animate-bounce-slow shadow-inner border border-white/50 dark:border-gray-700/50"
        >
          {#if errorCode === 410}
            <svg
              class="w-8 h-8 text-amber-600 animate-spin-slow"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4v2m0 4v2M7.08 6.47A9.01 9.01 0 1020.92 17.53M7.08 6.47L4.95 2.34m12.84 14.19l3.13 4.13"
              />
            </svg>
          {:else}
            <svg
              class="w-8 h-8 text-red-600 animate-wiggle"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          {/if}
        </div>
      </div>

      <!-- Error Title -->
      <h1
        class="text-3xl font-extrabold text-slate-900 dark:text-white mb-3 animate-slide-down tracking-tight"
      >
        {errorTitle}
      </h1>

      <!-- Error Code -->
      <div
        class="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 mb-5 animate-fade-in-delayed"
      >
        <p
          class="text-sm font-semibold text-slate-600 dark:text-gray-300 font-mono"
        >
          Error {errorCode}
        </p>
      </div>

      <!-- Error Description -->
      <p
        class="text-slate-600 dark:text-gray-400 mb-8 leading-relaxed animate-fade-in-delayed-2 text-lg"
      >
        {errorDescription}
      </p>

      <!-- Mini Game for 404 -->
      {#if showGame && errorCode === 404}
        <div
          class="mb-8 p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/30 animate-scale-in shadow-inner relative overflow-hidden group"
        >
          <div
            class="absolute inset-0 bg-white/40 dark:bg-gray-900/40 group-hover:bg-transparent transition-colors duration-300"
          ></div>
          <div class="relative z-10">
            <p
              class="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-4 flex items-center justify-center gap-2"
            >
              <span class="text-xl">🎮</span> Try the Clicking Game
            </p>

            {#if !gameActive}
              <button
                on:click={startGame}
                class="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-3.5 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25 active:scale-95 mb-2"
              >
                {gameScore > 0
                  ? `Try Again! (Best: ${gameScore} clicks)`
                  : "Start Game"}
              </button>
            {:else}
              <div class="space-y-4">
                <div
                  class="flex justify-between items-center bg-white/50 dark:bg-gray-800/50 rounded-lg px-4 py-2 border border-slate-200/50 dark:border-gray-700/50 backdrop-blur-sm"
                >
                  <span
                    class="text-sm font-medium text-slate-600 dark:text-gray-400"
                    >⏱️ {gameTime}s</span
                  >
                  <span
                    class="text-lg font-bold text-slate-800 dark:text-gray-200"
                    >🎯 {gameScore}</span
                  >
                </div>
                <button
                  on:click={handleGameClick}
                  class="w-full bg-gradient-to-b from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-white font-black py-8 rounded-xl transition-all duration-100 transform active:scale-90 active:translate-y-1 shadow-[0_8px_0_rgb(194,65,12)] hover:shadow-[0_6px_0_rgb(194,65,12)] active:shadow-[0_0px_0_rgb(194,65,12)] text-2xl tracking-wider uppercase border text-yellow-900 border-orange-600"
                >
                  🎯 CLICK ME!
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Action Button -->
      <button
        on:click={handleGoHome}
        class="w-full group relative overflow-hidden {errorCode === 410
          ? 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600'
          : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-gray-100 dark:text-slate-900 text-white'} font-semibold py-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl animate-fade-in-delayed-3 flex items-center justify-center gap-2"
      >
        <span class="relative z-10">{suggestedAction}</span>
        <svg
          class="w-5 h-5 relative z-10 transform transition-transform group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </button>

      <!-- Additional Info -->
      <p
        class="text-xs text-slate-400 dark:text-gray-500 mt-8 animate-fade-in-delayed-4"
      >
        {#if errorCode === 410}
          Please contact the form owner if you think this is an error.
        {:else if errorCode === 404}
          While you're here, play a quick game or go back home! 👋
        {:else}
          If you believe this is a mistake, please contact the form owner.
        {/if}
      </p>
    </div>
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
