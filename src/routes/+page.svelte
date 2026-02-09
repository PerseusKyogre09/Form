<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import { fade, fly } from "svelte/transition";
  import favicon from "$lib/assets/favicon.svg";
  import { Button } from "bits-ui";

  let user: any = null;

  onMount(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    user = session?.user;
  });
</script>

<div class="min-h-screen bg-white overflow-hidden text-black font-sans">
  <!-- Nav -->
  <nav
    class="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100"
  >
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <img src={favicon} alt="Quill" class="w-8 h-8" />
        <span class="text-xl font-bold tracking-tight">Quill</span>
      </div>

      <div class="hidden md:flex items-center gap-8">
        <a
          href="#features"
          class="text-sm font-medium text-gray-600 hover:text-black transition-colors"
          >Features</a
        >
        <a
          href="#templates"
          class="text-sm font-medium text-gray-600 hover:text-black transition-colors"
          >Templates</a
        >
        <a
          href="#pricing"
          class="text-sm font-medium text-gray-600 hover:text-black transition-colors"
          >Pricing</a
        >
      </div>

      <div class="flex items-center gap-4">
        {#if user}
          <a
            href="/dashboard"
            class="text-sm font-semibold text-gray-900 hover:text-black transition-colors px-4"
            >Dashboard</a
          >
        {:else}
          <a
            href="/login"
            class="text-sm font-semibold text-gray-900 hover:text-black transition-colors px-4"
            >Log in</a
          >
          <Button.Root
            href="/signup"
            class="rounded-xl bg-black text-white shadow-sm hover:bg-gray-900 inline-flex
	h-10 items-center justify-center px-6 text-sm
	font-semibold active:scale-[0.98] active:transition-all"
          >
            Get Started
          </Button.Root>
        {/if}
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="relative pt-48 pb-32">
    <!-- Animated background gradients -->
    <div
      class="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.03),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.02),transparent_40%)]"
    ></div>

    <div class="max-w-7xl mx-auto px-6 text-center">
      <div
        in:fly={{ y: 20, duration: 800 }}
        class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-[13px] font-medium text-gray-600 mb-8"
      >
        <span class="relative flex h-2 w-2">
          <span
            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
          ></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"
          ></span>
        </span>
        New: Username-based routing is live
      </div>

      <h1
        in:fly={{ y: 20, duration: 1000, delay: 200 }}
        class="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[1.05]"
      >
        Forms that feel<br />
        <span class="text-gray-400">more personal.</span>
      </h1>

      <p
        in:fly={{ y: 20, duration: 1000, delay: 400 }}
        class="max-w-2xl mx-auto text-xl text-gray-600 mb-12 leading-relaxed"
      >
        Beautiful, high-converting forms with custom slugs and seamless
        integrations. Join 10k+ creators building better data experiences.
      </p>

      <div
        in:fly={{ y: 20, duration: 1000, delay: 600 }}
        class="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <Button.Root
          href={user ? "/dashboard" : "/signup"}
          class="w-full sm:w-auto rounded-xl bg-dark text-background shadow-mini hover:bg-dark/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all"
        >
          Start building for free
        </Button.Root>
        <Button.Root
          href="/login"
          class="w-full sm:w-auto rounded-xl bg-dark text-background shadow-mini hover:bg-dark/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all"
        >
          View examples
        </Button.Root>
      </div>

      <!-- Mockup/Showcase -->
      <div
        in:fly={{ y: 40, duration: 1200, delay: 800 }}
        class="mt-24 relative"
      >
        <div
          class="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10"
        ></div>
        <div
          class="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 backdrop-blur-sm"
        >
          <div
            class="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden aspect-[16/9] flex items-center justify-center text-gray-400 italic"
          >
            <!-- Simulated Interface -->
            <div class="w-full h-full flex flex-col">
              <div class="h-12 border-b flex items-center px-6 gap-3">
                <div class="flex gap-1.5">
                  <div class="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                  <div class="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                </div>
                <div
                  class="flex-1 bg-gray-100 h-6 rounded-md flex items-center px-3 text-[10px] text-gray-500 font-medium"
                >
                  quill.com/form/username/product-feedback
                </div>
              </div>
              <div class="flex-1 p-12 text-left">
                <div
                  class="w-2/3 h-8 bg-gray-200 rounded-md mb-6 animate-pulse"
                ></div>
                <div class="w-full h-4 bg-gray-100 rounded-sm mb-3"></div>
                <div class="w-full h-4 bg-gray-100 rounded-sm mb-3"></div>
                <div class="w-full h-4 bg-gray-100 rounded-sm mb-12"></div>

                <div class="space-y-4">
                  <div
                    class="w-full h-14 border border-gray-200 rounded-lg"
                  ></div>
                  <div
                    class="w-full h-14 border border-gray-200 rounded-lg"
                  ></div>
                  <div class="w-1/3 h-14 bg-black rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Trust Bar -->
  <section class="border-t border-gray-100 py-16">
    <div class="max-w-7xl mx-auto px-6">
      <p
        class="text-center text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-10"
      >
        Trusted by modern teams
      </p>
      <div
        class="flex flex-wrap justify-center gap-12 md:gap-24 opacity-30 grayscale contrast-125"
      >
        <span class="text-2xl font-bold">Stripe</span>
        <span class="text-2xl font-bold">Vercel</span>
        <span class="text-2xl font-bold">Linear</span>
        <span class="text-2xl font-bold">Figma</span>
        <span class="text-2xl font-bold">Netflix</span>
      </div>
    </div>
  </section>

  <!-- Features Grid Preview -->
  <section id="features" class="py-32 bg-gray-50">
    <div class="max-w-7xl mx-auto px-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div class="space-y-4">
          <div
            class="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center font-bold text-xl"
          >
            1
          </div>
          <h3 class="text-xl font-bold">Intuitive Builder</h3>
          <p class="text-gray-600">
            Drag, drop, and customize. Building complex forms should feel like
            playing with blocks.
          </p>
        </div>
        <div class="space-y-4">
          <div
            class="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center font-bold text-xl"
          >
            2
          </div>
          <h3 class="text-xl font-bold">Custom Slugs</h3>
          <p class="text-gray-600">
            Professional URLs including your unique username. No more messy
            ID-based links.
          </p>
        </div>
        <div class="space-y-4">
          <div
            class="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center font-bold text-xl"
          >
            3
          </div>
          <h3 class="text-xl font-bold">Deep Analytics</h3>
          <p class="text-gray-600">
            Understand your users with drop-off tracking and conversion insights
            built-in.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-black text-white py-24">
    <div class="max-w-7xl mx-auto px-6">
      <div
        class="flex flex-col md:flex-row justify-between items-start gap-12 mb-24"
      >
        <div class="max-w-xs">
          <div class="flex items-center gap-2 mb-6">
            <img src={favicon} alt="Quill" class="w-6 h-6" />
            <span class="text-xl font-bold tracking-tight">Quill</span>
          </div>
          <p class="text-gray-400 text-sm leading-relaxed">
            The next generation of data collection. Simple for users, powerful
            for teams.
          </p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-16">
          <div class="space-y-4">
            <h4 class="font-bold text-sm">Product</h4>
            <ul class="space-y-2 text-sm text-gray-400">
              <li>
                <a href="/" class="hover:text-white transition-colors"
                  >Features</a
                >
              </li>
              <li>
                <a href="/" class="hover:text-white transition-colors"
                  >Resources</a
                >
              </li>
              <li>
                <a href="/" class="hover:text-white transition-colors"
                  >Templates</a
                >
              </li>
            </ul>
          </div>
          <div class="space-y-4">
            <h4 class="font-bold text-sm">Company</h4>
            <ul class="space-y-2 text-sm text-gray-400">
              <li>
                <a href="/" class="hover:text-white transition-colors">About</a>
              </li>
              <li>
                <a href="/" class="hover:text-white transition-colors">Blog</a>
              </li>
              <li>
                <a href="/" class="hover:text-white transition-colors"
                  >Careers</a
                >
              </li>
            </ul>
          </div>
          <div class="space-y-4">
            <h4 class="font-bold text-sm">Legal</h4>
            <ul class="space-y-2 text-sm text-gray-400">
              <li>
                <a href="/" class="hover:text-white transition-colors"
                  >Privacy</a
                >
              </li>
              <li>
                <a href="/" class="hover:text-white transition-colors">Terms</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div
        class="pt-12 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-8 text-[13px] text-gray-500"
      >
        <p>© 2026 Quill Labs Inc. All rights reserved.</p>
        <div class="flex gap-8">
          <a href="/" class="hover:text-white transition-colors">Twitter</a>
          <a href="/" class="hover:text-white transition-colors">LinkedIn</a>
          <a href="/" class="hover:text-white transition-colors">GitHub</a>
        </div>
      </div>
    </div>
  </footer>
</div>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }
</style>
