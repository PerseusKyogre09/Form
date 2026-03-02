<!-- src/lib/components/ThemesModal.svelte -->
<script lang="ts">
  import {
    type Form,
    type Theme,
    isBlockElement,
    type BlockElement,
    type Question,
    type ThankYouPage,
  } from "../types";
  import { THEMES } from "../themes";
  import { currentForm } from "../stores";

  export let inline = false;
  let isOpen = false;
  let currentFormData: Form;

  currentForm.subscribe((value) => {
    currentFormData = value;
  });

  function selectTheme(theme: Theme) {
    // Update the form with the selected theme and apply theme colors as customization template
    currentForm.update((form) => {
      const updatedForm: Form = {
        ...form,
        theme: theme,
      };

      // Apply theme colors to form customization options if theme has colors defined
      if (theme.colors) {
        if (theme.colors.background) {
          updatedForm.backgroundColor = theme.colors.background;
          updatedForm.backgroundType = "color";
        }
        if (theme.colors.text) {
          updatedForm.globalTextColor = theme.colors.text;
        }
      }

      // Apply theme colors to all questions and blocks
      if (updatedForm.questions && theme.colors) {
        updatedForm.questions = updatedForm.questions.map((element) => {
          if (isBlockElement(element)) {
            // For content blocks, update background and text color
            return {
              ...element,
              backgroundColor:
                theme.colors?.background || element.backgroundColor,
              textColor: theme.colors?.text || element.textColor,
            };
          } else {
            // For questions, update accent and text colors
            const question = element as Question;
            return {
              ...question,
              accentColor: theme.colors?.accent || question.accentColor,
              textColor: theme.colors?.text || question.textColor,
            };
          }
        });
      }

      // Apply thank you page template if available
      if (theme.thankYouTemplate) {
        updatedForm.thankYouPage = {
          ...updatedForm.thankYouPage,
          ...theme.thankYouTemplate,
          theme: theme.id,
        } as ThankYouPage;
      }

      return updatedForm;
    });

    if (!inline) {
      closeModal();
    }
  }

  function closeModal() {
    isOpen = false;
  }

  function openModal() {
    isOpen = true;
  }
</script>

<div>
  {#if !inline}
    <!-- Theme Button -->
    <button
      on:click={openModal}
      class="w-full px-4 py-2 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 transition-colors rounded-xl text-white shadow-mini hover:bg-purple-700/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all cursor-pointer"
    >
      <i class="fas fa-palette mr-2"></i> Themes
    </button>
  {/if}

  <!-- Modal Backdrop / Inline Content -->
  {#if isOpen || inline}
    <div
      class={inline
        ? "w-full"
        : "fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm"}
      on:click={inline ? undefined : closeModal}
      on:keydown={(e) => !inline && e.key === "Escape" && closeModal()}
      role={inline ? undefined : "dialog"}
      aria-modal={inline ? undefined : "true"}
    >
      <!-- Modal/Inline Content -->
      <div
        class={inline
          ? "w-full"
          : "bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-transparent dark:border-gray-800 transition-colors"}
        on:click={(e) => !inline && e.stopPropagation()}
        role={inline ? undefined : "document"}
      >
        {#if !inline}
          <div
            class="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 z-10 transition-colors"
          >
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                <i
                  class="fas fa-palette mr-2 text-purple-600 dark:text-purple-400"
                ></i>
                Select a Theme
              </h2>
              <button
                on:click={closeModal}
                class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl leading-none transition-colors"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Choose a theme to change the overall look and feel of your form
            </p>
          </div>
        {/if}

        <div class={inline ? "space-y-4" : "p-6"}>
          <div class="grid grid-cols-1 {inline ? '' : 'md:grid-cols-2'} gap-4">
            {#each THEMES as theme (theme.id)}
              <button
                on:click={() => selectTheme(theme)}
                class="relative border-2 rounded-lg p-4 transition-all hover:shadow-lg w-full {currentFormData
                  ?.theme?.id === theme.id
                  ? 'border-purple-600 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-slate-300 dark:hover:border-gray-600'}"
              >
                {#if currentFormData?.theme?.id === theme.id}
                  <div
                    class="absolute top-2 right-2 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    <i class="fas fa-check text-xs"></i>
                  </div>
                {/if}

                <div class="text-left">
                  <h3
                    class="font-bold text-slate-900 dark:text-white text-sm mb-1"
                  >
                    {theme.name}
                  </h3>
                  {#if theme.description}
                    <p
                      class="text-xs text-slate-500 dark:text-gray-400 mb-3 line-clamp-2"
                    >
                      {theme.description}
                    </p>
                  {/if}

                  <!-- Color Preview -->
                  {#if theme.colors}
                    <div class="flex gap-2 items-center">
                      {#each Object.entries(theme.colors).slice(0, 4) as [colorName, colorValue]}
                        {#if colorValue}
                          <div class="flex flex-col items-center gap-1">
                            <div
                              class="w-6 h-6 rounded border border-gray-200 dark:border-gray-600 shadow-sm"
                              style="background-color: {colorValue}"
                              title={colorName}
                            ></div>
                          </div>
                        {/if}
                      {/each}
                    </div>
                  {/if}
                </div>
              </button>
            {/each}
          </div>

          <div
            class="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100/50 dark:border-indigo-800/30 transition-colors"
          >
            <p class="text-xs text-indigo-700 dark:text-indigo-400">
              <i class="fas fa-info-circle mr-1"></i>
              <strong>Tip:</strong> You can still customize colors separately after
              selecting a theme.
            </p>
          </div>
        </div>

        {#if !inline}
          <div
            class="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-6 py-4 rounded-b-lg transition-colors"
          >
            <button
              on:click={closeModal}
              class="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  /* Ensure modal appears above other elements */
  :global([data-theme-id]) {
    z-index: 40;
  }
</style>
