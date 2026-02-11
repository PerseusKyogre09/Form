<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import { fade, fly } from "svelte/transition";
  import favicon from "$lib/assets/favicon.svg";
  import quillScreenshot from "$lib/assets/demo/quill.png";
  import { Button } from "bits-ui";
  import { browser } from "$app/environment";
  import gsap from "gsap";
  import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

  if (browser) {
    gsap.registerPlugin(ScrollTrigger);
  }

  let user: any = null;

  onMount(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    user = session?.user;

    // Animate elements on scroll
    gsap.utils.toArray(".animate-on-scroll").forEach((element: any) => {
      gsap.from(element, {
        scrollTrigger: {
          trigger: element,
          start: "top 80%",
        },
        opacity: 0,
        y: 30,
        duration: 0.8,
      });
    });

    // Subtle floating animation for hero image
    const heroGif = document.querySelector(".hero-gif");
    if (heroGif) {
      gsap.to(heroGif, {
        y: -8,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    // Stagger animation for feature items
    gsap.to(".feature-item", {
      scrollTrigger: {
        trigger: ".features-grid",
        start: "top 70%",
      },
      opacity: 1,
      x: 0,
      duration: 0.6,
      stagger: 0.1,
    });
  });
</script>

<div class="min-h-screen bg-white overflow-hidden text-black font-sans">
  <!-- Nav -->
  <nav class="fixed top-0 w-full z-50 bg-white border-b border-black/10">
    <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <img src={favicon} alt="Quill" class="w-6 h-6" />
        <span class="text-lg font-bold tracking-tight">Quill</span>
      </div>

      <div class="flex items-center gap-4">
        {#if user}
          <a
            href="/dashboard"
            class="text-sm font-medium text-black hover:text-black/70 transition-colors"
            >Dashboard</a
          >
        {:else}
          <a
            href="/login"
            class="text-sm font-medium text-black hover:text-black/70 transition-colors"
            >Log in</a
          >
          <Button.Root
            href="/signup"
            class="rounded-lg bg-black text-white shadow-sm hover:bg-black/90 inline-flex
	h-9 items-center justify-center px-5 text-sm
	font-medium active:scale-[0.98] active:transition-all"
          >
            Create a form
          </Button.Root>
        {/if}
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="relative pt-32 pb-20">
    <div class="max-w-7xl mx-auto px-6">
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1
            in:fly={{ y: 20, duration: 800 }}
            class="text-5xl md:text-6xl font-black tracking-tight mb-6 leading-[1.1]"
          >
            Google Forms works.
            <br />
            <span class="text-black/60">It just doesn't feel good.</span>
          </h1>

          <p
            in:fly={{ y: 20, duration: 800, delay: 150 }}
            class="max-w-xl text-lg md:text-xl text-black/70 mb-8 leading-relaxed font-medium"
          >
            Quill makes forms that feel <span class="font-bold">fast</span>,
            <span class="font-bold">intentional</span>, and
            <span class="font-bold">actually enjoyable</span> to fill.
          </p>

          <div
            in:fly={{ y: 20, duration: 800, delay: 300 }}
            class="flex flex-col sm:flex-row items-start gap-3"
          >
            <Button.Root
              href={user ? "/dashboard" : "/signup"}
              class="rounded-lg bg-black text-white shadow-sm hover:bg-black/90 inline-flex
	h-11 items-center justify-center px-6 text-sm
	font-semibold active:scale-[0.98] active:transition-all"
            >
              Try a live demo
            </Button.Root>
            <Button.Root
              href={user ? "/dashboard" : "/signup"}
              class="rounded-lg border border-black text-black bg-white hover:bg-black hover:text-white inline-flex
	h-11 items-center justify-center px-6 text-sm
	font-semibold active:scale-[0.98] active:transition-all transition-colors"
            >
              Create a form
            </Button.Root>
          </div>
        </div>

        <!-- Motion Preview GIF Placeholder -->
        <div
          in:fly={{ y: 40, duration: 1000, delay: 400 }}
          class="relative hero-gif"
        >
          <img
            src="https://via.placeholder.com/600x500/000000/ffffff?text=Form+Preview+GIF"
            alt="Form preview animation"
            class="w-full rounded-lg shadow-2xl border border-black/10"
          />
        </div>
      </div>
    </div>
  </section>

  <!-- The Problem Section -->
  <section class="border-t border-black/10 py-20">
    <div class="max-w-7xl mx-auto px-6">
      <div class="mb-16 animate-on-scroll">
        <h2 class="text-4xl md:text-5xl font-black tracking-tight mb-4">
          Most forms feel like paperwork.
        </h2>
        <p class="text-lg text-black/60">Here's the difference.</p>
      </div>

      <div class="grid lg:grid-cols-2 gap-12">
        <!-- Google Forms style (cluttered) -->
        <div class="space-y-4 animate-on-scroll">
          <h3 class="text-lg font-bold text-black/70">The typical form</h3>
          <div
            class="bg-gray-50 border border-black/10 rounded-lg p-8 space-y-4"
          >
            <div class="space-y-2">
              <label class="text-sm font-medium">What's your name?</label>
              <input
                type="text"
                placeholder="Name"
                class="w-full border border-black/10 rounded px-3 py-2 text-sm"
                disabled
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Email address</label>
              <input
                type="email"
                placeholder="Email"
                class="w-full border border-black/10 rounded px-3 py-2 text-sm"
                disabled
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Company</label>
              <input
                type="text"
                placeholder="Company"
                class="w-full border border-black/10 rounded px-3 py-2 text-sm"
                disabled
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Message</label>
              <textarea
                placeholder="Type your message..."
                class="w-full border border-black/10 rounded px-3 py-2 text-sm h-20"
                disabled
              ></textarea>
            </div>
            <div class="flex gap-2">
              <button
                class="bg-black/20 text-black/50 px-4 py-2 rounded text-sm font-medium"
                disabled>Cancel</button
              >
              <button
                class="bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium"
                disabled>Submit</button
              >
            </div>
          </div>
          <ul class="space-y-2 text-sm text-black/60">
            <li>• Everything visible at once</li>
            <li>• Scanning fatigue</li>
            <li>• Looks like work</li>
          </ul>
        </div>

        <!-- Quill (focused) - Image placeholder -->
        <div class="space-y-4 animate-on-scroll">
          <h3 class="text-lg font-bold">With Quill</h3>
          <img
            src={quillScreenshot}
            alt="Quill form experience"
            class="w-full rounded-lg shadow-lg border border-black/10"
          />
          <ul class="space-y-2 text-sm text-black/60">
            <li>• One thing at a time</li>
            <li>• Focused conversation</li>
            <li>• Feels intentional</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- Experience Section -->
  <section class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-6">
      <div class="mb-16 animate-on-scroll">
        <h2 class="text-4xl md:text-5xl font-black tracking-tight">
          Built for the way you actually work.
        </h2>
      </div>

      <div class="grid md:grid-cols-2 gap-12 features-grid">
        <!-- Username URLs -->
        <div
          class="space-y-4 feature-item opacity-0"
          style="--tw-translate-x: 30px;"
        >
          <div class="text-5xl font-black text-black/10">→</div>
          <h3 class="text-2xl font-bold">Username-based URLs</h3>
          <p class="text-black/70">
            No random IDs. Just your name and the form slug. Share it anywhere.
          </p>
          <code
            class="block bg-black/5 border border-black/10 rounded px-4 py-3 text-sm font-mono text-black/70"
          >
            quill.com/user/feedback
          </code>
        </div>

        <!-- Keyboard first -->
        <div
          class="space-y-4 feature-item opacity-0"
          style="--tw-translate-x: 30px;"
        >
          <div class="text-5xl font-black text-black/10">⌨</div>
          <h3 class="text-2xl font-bold">Keyboard-first navigation</h3>
          <p class="text-black/70">
            Tab through. Hit enter. No mouse needed. Fast and intentional.
          </p>
          <div
            class="bg-black/5 border border-black/10 rounded px-4 py-3 text-sm text-black/60"
          >
            Tab ↹ Next • Enter ↵ Submit • Esc Back
          </div>
        </div>

        <!-- Clean transitions -->
        <div
          class="space-y-4 feature-item opacity-0"
          style="--tw-translate-x: 30px;"
        >
          <div class="text-5xl font-black text-black/10">✨</div>
          <h3 class="text-2xl font-bold">Smooth question transitions</h3>
          <p class="text-black/70">
            Each question flows naturally. No jarring page reloads or jumps.
          </p>
        </div>

        <!-- Anonymous friendly -->
        <div
          class="space-y-4 feature-item opacity-0"
          style="--tw-translate-x: 30px;"
        >
          <div class="text-5xl font-black text-black/10">🔗</div>
          <h3 class="text-2xl font-bold">Share a link, collect responses</h3>
          <p class="text-black/70">
            No signups. No accounts. Just a link. That's it.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Built For Section -->
  <section class="py-20 border-t border-black/10">
    <div class="max-w-7xl mx-auto px-6">
      <h2
        class="text-4xl md:text-5xl font-black tracking-tight mb-12 animate-on-scroll"
      >
        Built for.
      </h2>

      <div class="grid md:grid-cols-2 gap-8">
        <div
          class="border border-black/10 rounded-lg p-6 animate-on-scroll hover:border-black/30 transition-colors cursor-default"
        >
          <h3 class="text-xl font-bold mb-2">College clubs</h3>
          <p class="text-black/60">Sign-ups, feedback, event RSVPs.</p>
        </div>
        <div
          class="border border-black/10 rounded-lg p-6 animate-on-scroll hover:border-black/30 transition-colors cursor-default"
        >
          <h3 class="text-xl font-bold mb-2">Hackathons</h3>
          <p class="text-black/60">Registration, idea voting, feedback.</p>
        </div>
        <div
          class="border border-black/10 rounded-lg p-6 animate-on-scroll hover:border-black/30 transition-colors cursor-default"
        >
          <h3 class="text-xl font-bold mb-2">Recruiter pipelines</h3>
          <p class="text-black/60">Applications, referrals, surveys.</p>
        </div>
        <div
          class="border border-black/10 rounded-lg p-6 animate-on-scroll hover:border-black/30 transition-colors cursor-default"
        >
          <h3 class="text-xl font-bold mb-2">Internal tools</h3>
          <p class="text-black/60">
            Feedback, requests, quick data collection.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-20 bg-black text-white">
    <div class="max-w-4xl mx-auto px-6 animate-on-scroll">
      <h2 class="text-4xl md:text-5xl font-black mb-6">
        Ready to build better forms?
      </h2>
      <p class="text-xl text-white/70 mb-8">
        No credit card required. No features locked behind a paywall.
      </p>
      <Button.Root
        href={user ? "/dashboard" : "/signup"}
        class="rounded-lg bg-white text-black shadow-sm hover:bg-white/90 inline-flex
	h-12 items-center justify-center px-8 text-base
	font-semibold active:scale-[0.98] active:transition-all"
      >
        Create a form now
      </Button.Root>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-black text-white py-16">
    <div class="max-w-7xl mx-auto px-6">
      <div
        class="flex flex-col md:flex-row justify-between items-start gap-12 mb-16"
      >
        <div class="max-w-xs">
          <div class="flex items-center gap-2 mb-4">
            <img src={favicon} alt="Quill" class="w-6 h-6" />
            <span class="text-lg font-bold tracking-tight">Quill</span>
          </div>
          <p class="text-white/60 text-sm">
            Forms that feel good. Made by someone who cares.
          </p>
        </div>

        <div class="grid grid-cols-3 gap-8 text-sm">
          <div class="space-y-3">
            <h4 class="font-bold text-white">Product</h4>
            <ul class="space-y-2 text-white/60">
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
            </ul>
          </div>
          <div class="space-y-3">
            <h4 class="font-bold text-white">Company</h4>
            <ul class="space-y-2 text-white/60">
              <li>
                <a href="/" class="hover:text-white transition-colors">About</a>
              </li>
              <li>
                <a href="/" class="hover:text-white transition-colors"
                  >Twitter</a
                >
              </li>
            </ul>
          </div>
          <div class="space-y-3">
            <h4 class="font-bold text-white">Legal</h4>
            <ul class="space-y-2 text-white/60">
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

      <div class="pt-8 border-t border-white/10 text-sm text-white/50">
        <p>© 2026 Quill. All rights reserved.</p>
      </div>
    </div>
  </footer>
</div>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }
</style>
