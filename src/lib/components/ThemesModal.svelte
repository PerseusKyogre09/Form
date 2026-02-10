<!-- src/lib/components/ThemesModal.svelte -->
<script lang="ts">
  import type { Form, Theme } from "../types";
  import { THEMES } from "../themes";
  import { currentForm } from "../stores";

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
          updatedForm.backgroundType = 'color';
        }
        if (theme.colors.text) {
          updatedForm.globalTextColor = theme.colors.text;
        }
      }

      // Apply theme colors to all questions and blocks
      if (updatedForm.questions && theme.colors) {
        updatedForm.questions = updatedForm.questions.map((element) => {
          const isBlock = (element as any).kind === 'block';
          
          if (isBlock) {
            // For content blocks, update background and text color
            return {
              ...element,
              backgroundColor: theme.colors?.background || element.backgroundColor,
              textColor: theme.colors?.text || element.textColor,
            };
          } else {
            // For questions, update accent and text colors
            return {
              ...element,
              accentColor: theme.colors?.accent || element.accentColor,
              textColor: theme.colors?.text || element.textColor,
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
        };
      }

      return updatedForm;
    });

    closeModal();
  }

  function closeModal() {
    isOpen = false;
  }

  function openModal() {
    isOpen = true;
  }
</script>

<div>
  <!-- Theme Button -->
  <button
    on:click={openModal}
    class="w-full px-4 py-2 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 transition-colors rounded-xl text-white shadow-mini hover:bg-purple-700/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all cursor-pointer"
  >
    <i class="fas fa-palette mr-2"></i> Themes
  </button>

  <!-- Modal Backdrop -->
  {#if isOpen}
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      on:click={closeModal}
      on:keydown={(e) => e.key === "Escape" && closeModal()}
      role="dialog"
      aria-modal="true"
    >
      <!-- Modal Content -->
      <div
        class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        on:click={(e) => e.stopPropagation()}
        role="document"
      >
        <div
          class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10"
        >
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-900">
              <i class="fas fa-palette mr-2 text-purple-600"></i>
              Select a Theme
            </h2>
            <button
              on:click={closeModal}
              class="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
          <p class="text-sm text-gray-600 mt-1">
            Choose a theme to change the overall look and feel of your form
          </p>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each THEMES as theme (theme.id)}
              <button
                on:click={() => selectTheme(theme)}
                class="relative border-2 rounded-lg p-4 transition-all hover:shadow-lg {currentFormData
                  ?.theme?.id === theme.id
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'}"
              >
                {#if currentFormData?.theme?.id === theme.id}
                  <div
                    class="absolute top-2 right-2 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    <i class="fas fa-check text-xs"></i>
                  </div>
                {/if}

                <div class="text-left">
                  <h3 class="font-bold text-gray-900 text-lg mb-1">
                    {theme.name}
                  </h3>
                  {#if theme.description}
                    <p class="text-sm text-gray-600 mb-3">
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
                              class="w-8 h-8 rounded border border-gray-300 shadow-sm"
                              style="background-color: {colorValue}"
                              title={colorName}
                            />
                            <span class="text-xs text-gray-500 capitalize">
                              {colorName.substring(0, 3)}
                            </span>
                          </div>
                        {/if}
                      {/each}
                    </div>
                  {/if}
                </div>
              </button>
            {/each}
          </div>

          <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p class="text-sm text-blue-700">
              <i class="fas fa-info-circle mr-2"></i>
              <strong>Tip:</strong> You can still customize animations and backgrounds
              separately after selecting a theme.
            </p>
          </div>
        </div>

        <div class="border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-lg">
          <button
            on:click={closeModal}
            class="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
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
