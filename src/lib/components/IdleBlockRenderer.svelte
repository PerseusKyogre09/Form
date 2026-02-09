<!-- src/lib/components/IdleBlockRenderer.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import type { BlockElement } from "../types";

  export let element: BlockElement;
  export let colorPalette: any;
  export let globalTextColor: string = "";

  let typingComplete = false;
  let displayedText = "";
  let showCursor = true;

  // Parse the title to extract code structure
  function parseCodeTitle(title: string) {
    // Pattern: const event = "Geek Room Recruitment";
    const match = title.match(
      /^(const|let|var)\s+(\w+)\s*=\s*["\'](.+?)["\']/
    );
    if (match) {
      return {
        keyword: match[1],
        variable: match[2],
        stringValue: match[3],
      };
    }
    return null;
  }

  // Get the display title from headerText or title
  function getTitleForDisplay(): string {
    return element.headerText || element.title || "";
  }

  // Typing animation for welcome text
  function startTypingAnimation() {
    const textToType = element.text || "";
    let currentIndex = 0;
    const typingSpeed = 50; // ms per character

    const interval = setInterval(() => {
      if (currentIndex <= textToType.length) {
        displayedText = textToType.substring(0, currentIndex);
        currentIndex++;
      } else {
        clearInterval(interval);
        typingComplete = true;
      }
    }, typingSpeed);
  }

  // Blinking cursor effect
  function startCursorBlink() {
    const interval = setInterval(() => {
      showCursor = !showCursor;
    }, 500); // Blink every 500ms

    return () => clearInterval(interval);
  }

  onMount(() => {
    // Start typing animation
    startTypingAnimation();

    // Start cursor blinking
    const unsubscribeCursor = startCursorBlink();

    return () => {
      unsubscribeCursor();
    };
  });

  const codeTitle = parseCodeTitle(getTitleForDisplay());
</script>

<!-- IDE Theme Block - No Card Container, Floating Content - Responsive & Full Screen -->
<div class="w-full h-screen overflow-hidden flex items-center justify-center" style="background: transparent;">
  <!-- Semi-transparent glowing logo background -->
  {#if element.imageUrl}
    <div
      class="absolute inset-0 flex items-center justify-center pointer-events-none"
      style="opacity: 0.08;"
    >
      <img
        src={element.imageUrl}
        alt="Background logo"
        class="w-full h-full object-contain max-w-[120vmin] max-h-[120vmin]"
        style="filter: drop-shadow(0 0 40px rgba(20, 184, 166, 0.6)); animation: glow-pulse 3s ease-in-out infinite;"
      />
    </div>
  {/if}

  <!-- Main content floating over background - scales to cover 70-80% of screen -->
  <div class="relative z-10 flex flex-col items-center justify-center w-11/12 max-w-4xl max-h-[80vh] px-4 md:px-8 lg:px-12">
    <!-- Title as Code - Responsive sizing -->
    {#if codeTitle}
      <!-- Structured code syntax highlighting -->
      <div class="w-full text-center font-mono text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight break-words" style="font-family: 'JetBrains Mono', monospace;">
        <span style="color: #a0a0a0;">const</span>
        <span style="color: #e0e0e0;"> </span>
        <span style="color: #ce9178;">{codeTitle.variable}</span>
        <span style="color: #a0a0a0;"> = </span>
        <span style="color: #14b8a6;">"</span>{codeTitle.stringValue}<span style="color: #14b8a6;">"</span>
        <span style="color: #a0a0a0;">;</span>
      </div>
    {:else}
      <!-- Fallback: plain code-styled title -->
      <div class="w-full text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight" style="color: #e0e0e0; font-family: 'JetBrains Mono', monospace;">
        {getTitleForDisplay()}
      </div>
    {/if}

    <!-- Spacer -->
    <div class="flex-shrink-0 h-6 md:h-8 lg:h-10"></div>

    <!-- Welcome text with typing animation - Responsive sizing -->
    {#if element.text}
      <div class="relative w-full text-center min-h-[2rem] md:min-h-[3rem] lg:min-h-[4rem] flex items-center justify-center">
        <div
          class="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl leading-relaxed"
          style="color: #ffffff; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.5px;"
        >
          {displayedText}
          <span
            class="inline-block w-1.5 md:w-2 bg-white ml-3 md:ml-4 align-text-top"
            style="height: 1em; animation: blink 0.7s infinite;"
          ></span>
        </div>
      </div>
    {/if}

    <!-- Spacer -->
    <div class="flex-shrink-0 h-4 md:h-6 lg:h-8"></div>

    <!-- Signature as code comment - Responsive sizing -->
    {#if element.footerText}
      <div class="w-full text-center text-xs sm:text-sm md:text-base lg:text-lg" style="color: #808080; font-family: 'JetBrains Mono', monospace;">
        <span style="color: #6a9fb5;">// </span>
        {element.footerText}
      </div>
    {/if}
  </div>
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap");

  /* Glow pulse animation for logo */
  @keyframes glow-pulse {
    0%,
    100% {
      filter: drop-shadow(0 0 40px rgba(20, 184, 166, 0.6));
    }
    50% {
      filter: drop-shadow(0 0 60px rgba(20, 184, 166, 0.9));
    }
  }

  /* Blinking cursor animation */
  @keyframes blink {
    0%,
    50% {
      opacity: 1;
    }
    51%,
    100% {
      opacity: 0;
    }
  }
</style>

