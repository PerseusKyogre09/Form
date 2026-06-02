<!-- src/lib/components/ThemesModal.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
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
  import { notifications } from "../stores/notifications";

  export let inline = false;
  let isOpen = false;
  let currentFormData: Form;
  let customThemes: Theme[] = [];
  let loadingCustomThemes = false;
  let activeTab: "standard" | "custom" = "standard";

  currentForm.subscribe((value) => {
    currentFormData = value;
  });

  onMount(async () => {
    await fetchCustomThemes();
  });

  async function fetchCustomThemes() {
    loadingCustomThemes = true;
    try {
      const res = await fetch("/api/themes");
      if (res.ok) {
        const data = await res.json();
        // Map database format to frontend Theme interface
        customThemes = data.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description || "",
          fontUrl: t.font_url || "",
          cssUrl: t.css_url || "",
          customCss: t.custom_css || "",
          customJs: t.custom_js || "",
          customHtmlHeader: t.custom_html_header || "",
          customHtmlFooter: t.custom_html_footer || "",
          border_radius: t.border_radius,
          input_radius: t.input_radius,
          is_public: t.is_public,
          colors: t.colors || {},
        }));
      }
    } catch (err) {
      console.error("Failed to load custom themes:", err);
    } finally {
      loadingCustomThemes = false;
    }
  }

  async function deleteTheme(id: string, event: Event) {
    event.stopPropagation(); // Stop propagation to avoid selecting the theme
    if (!confirm("Are you sure you want to delete this custom theme?")) return;

    try {
      const res = await fetch(`/api/themes?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        customThemes = customThemes.filter((t) => t.id !== id);
        notifications.add("Theme deleted successfully!", "success");

        // If the deleted theme was selected on the active form, reset form theme to undefined
        if (currentFormData?.theme?.id === id) {
          currentForm.update((form) => ({
            ...form,
            theme: undefined,
          }));
        }
      } else {
        const errorText = await res.text();
        notifications.add("Failed to delete theme: " + errorText, "error");
      }
    } catch (err) {
      console.error("Error deleting theme:", err);
      notifications.add("Failed to delete theme", "error");
    }
  }

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
    fetchCustomThemes();
  }
</script>

<div>
  {#if !inline}
    <!-- Theme Button -->
    <button
      on:click={openModal}
      class="btn btn-primary w-full h-12 px-[21px] text-[15px] font-semibold active:scale-[0.98]"
    >
      <i class="fas fa-palette mr-2"></i> Themes
    </button>
  {/if}

  <!-- Modal Backdrop / Inline Content -->
  {#if isOpen || inline}
    <div
      class={inline
        ? "w-full"
        : "fixed inset-0 bg-black/40 dark:bg-black/55 flex items-center justify-center z-50 backdrop-blur-sm"}
      on:click={inline ? undefined : closeModal}
      on:keydown={(e) => !inline && e.key === "Escape" && closeModal()}
      role={inline ? undefined : "dialog"}
      aria-modal={inline ? undefined : "true"}
    >
      <!-- Modal/Inline Content -->
      <div
        class={inline
          ? "w-full"
          : "surface surface-strong max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto transition-colors"}
        on:click={(e) => !inline && e.stopPropagation()}
        role={inline ? undefined : "document"}
      >
        {#if !inline}
          <div
            class="sticky top-0 surface-strong border-b border-[color:var(--border)] px-6 py-4 z-10 transition-colors"
          >
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold tracking-tight text-[color:var(--text)]">
                <i class="fas fa-palette mr-2 text-[color:var(--accent)]"></i>
                Select a Theme
              </h2>
              <button
                on:click={closeModal}
                class="text-[color:var(--text-soft)] hover:text-[color:var(--text)] text-2xl leading-none transition-colors"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <p class="text-sm text-[color:var(--text-soft)] mt-1">
              Choose a theme to change the overall look and feel of your form
            </p>
          </div>
        {/if}

        <div class={inline ? "space-y-4" : "p-6"}>
          <!-- Tabs Selection -->
          <div class="flex border-b border-[color:var(--border)] mb-6">
            <button
              on:click={() => (activeTab = "standard")}
              class="px-4 py-2 font-semibold text-sm transition-all border-b-2 {activeTab === 'standard'
                ? 'border-[color:var(--accent)] text-[color:var(--text)]'
                : 'border-transparent text-[color:var(--text-soft)] hover:text-[color:var(--text)]'}"
            >
              Standard Themes
            </button>
            <button
              on:click={() => (activeTab = "custom")}
              class="px-4 py-2 font-semibold text-sm transition-all border-b-2 {activeTab === "custom"
                ? 'border-[color:var(--accent)] text-[color:var(--text)]'
                : 'border-transparent text-[color:var(--text-soft)] hover:text-[color:var(--text)]'}"
            >
              My Custom Themes
            </button>
          </div>

          {#if activeTab === "standard"}
            <!-- Predefined Standard Themes -->
            <div class="grid grid-cols-1 {inline ? '' : 'md:grid-cols-2'} gap-4">
              {#each THEMES as theme (theme.id)}
                <button
                  on:click={() => selectTheme(theme)}
                  class="relative border-2 rounded-lg p-4 transition-all hover:shadow-lg w-full text-left {currentFormData
                    ?.theme?.id === theme.id
                    ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]'
                    : 'border-[color:var(--border)] bg-[color:var(--surface)] hover:border-[color:var(--border-strong)]'}"
                >
                  {#if currentFormData?.theme?.id === theme.id}
                    <div
                      class="absolute top-2 right-2 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center z-10"
                    >
                      <i class="fas fa-check text-xs"></i>
                    </div>
                  {/if}

                  <div>
                    <h3
                      class="font-bold text-[color:var(--text)] text-sm mb-1"
                    >
                      {theme.name}
                    </h3>
                    {#if theme.description}
                      <p
                        class="text-xs text-[color:var(--text-soft)] mb-3 line-clamp-2"
                      >
                        {theme.description}
                      </p>
                    {/if}

                    <!-- Color Preview -->
                    {#if theme.colors}
                      <div class="flex gap-2 items-center">
                        {#each Object.entries(theme.colors).slice(0, 4) as [colorName, colorValue]}
                          {#if colorValue}
                            <div
                              class="w-6 h-6 rounded border border-[color:var(--border)] shadow-sm"
                              style="background-color: {colorValue}"
                              title={colorName}
                            ></div>
                          {/if}
                        {/each}
                      </div>
                    {/if}
                  </div>
                </button>
              {/each}
            </div>
          {:else}
            <!-- User Saved Custom Themes -->
            {#if loadingCustomThemes}
              <div class="text-center py-12">
                <i
                  class="fas fa-spinner fa-spin text-purple-600 dark:text-purple-400 text-3xl mb-3"
                ></i>
                <p class="text-sm text-[color:var(--text-soft)]">
                  Loading custom themes...
                </p>
              </div>
            {:else}
              <!-- Saved custom themes placeholder or list -->
              {#if customThemes.length === 0}
                <div
                  class="text-center py-12 border-2 border-dashed border-[color:var(--border)] rounded-xl"
                >
                  <i
                    class="fas fa-magic text-[color:var(--text-soft)] text-4xl mb-3"
                  ></i>
                  <h3
                    class="text-sm font-semibold text-[color:var(--text)]"
                  >
                    No custom themes yet
                  </h3>
                  <p
                    class="text-xs text-[color:var(--text-soft)] mt-1 max-w-sm mx-auto"
                  >
                    Click the Custom Theme Builder link in the sidebar to design variables, add custom HTML/CSS/JS, and save a reusable theme template!
                  </p>
                </div>
              {:else}
                <div class="grid grid-cols-1 {inline ? '' : 'md:grid-cols-2'} gap-4">
                  {#each customThemes as theme (theme.id)}
                    <div
                      role="button"
                      tabindex="0"
                      on:click={() => selectTheme(theme)}
                      on:keydown={(e) => e.key === "Enter" && selectTheme(theme)}
                      class="relative border-2 rounded-lg p-4 transition-all hover:shadow-lg w-full text-left cursor-pointer {currentFormData
                        ?.theme?.id === theme.id
                        ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]'
                        : 'border-[color:var(--border)] bg-[color:var(--surface)] hover:border-[color:var(--border-strong)]'}"
                    >
                      {#if currentFormData?.theme?.id === theme.id}
                        <div
                          class="absolute top-2 right-2 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center z-10"
                        >
                          <i class="fas fa-check text-xs"></i>
                        </div>
                      {/if}

                      <div class="pr-6">
                        <div class="flex items-center justify-between gap-2 mb-1">
                          <h3
                            class="font-bold text-[color:var(--text)] text-sm truncate"
                          >
                            {theme.name}
                          </h3>
                          <button
                            on:click={(e) => deleteTheme(theme.id, e)}
                            class="text-[color:var(--text-soft)] hover:text-[color:var(--danger)] transition-colors p-1"
                            title="Delete Custom Theme"
                            aria-label="Delete Theme"
                          >
                            <i class="fas fa-trash-alt text-xs"></i>
                          </button>
                        </div>

                        {#if theme.description}
                          <p
                            class="text-xs text-[color:var(--text-soft)] mb-3 line-clamp-2"
                          >
                            {theme.description}
                          </p>
                        {/if}

                        <!-- Feature Badges -->
                        <div class="flex flex-wrap gap-1.5 mb-3">
                          {#if theme.customCss}
                            <span
                              class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30"
                              >CSS</span
                            >
                          {/if}
                          {#if theme.customJs}
                            <span
                              class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"
                              >JS</span
                            >
                          {/if}
                          {#if theme.customHtmlHeader || theme.customHtmlFooter}
                            <span
                              class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30"
                              >HTML</span
                            >
                          {/if}
                          {#if theme.border_radius !== undefined || theme.input_radius !== undefined}
                            <span
                              class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30"
                              >LAYOUT</span
                            >
                          {/if}
                        </div>

                        <!-- Color Preview -->
                        {#if theme.colors}
                          <div class="flex gap-1.5 items-center">
                            {#each Object.entries(theme.colors).slice(0, 5) as [colorName, colorValue]}
                              {#if colorValue}
                                <div
                                  class="w-6 h-6 rounded border border-[color:var(--border)] shadow-sm"
                                  style="background-color: {colorValue}"
                                  title={colorName}
                                ></div>
                              {/if}
                            {/each}
                          </div>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            {/if}
          {/if}

          <div
            class="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100/50 dark:border-indigo-800/30 transition-colors"
          >
            <p class="text-xs text-indigo-700 dark:text-indigo-400">
              <i class="fas fa-info-circle mr-1"></i>
              <strong>Tip:</strong> You can still customize colors separately
              after selecting a theme.
            </p>
          </div>
        </div>

        {#if !inline}
          <div
            class="border-t border-[color:var(--border)] bg-[color:var(--surface-muted)] px-6 py-4 rounded-b-lg transition-colors"
          >
            <button
              on:click={closeModal}
              class="w-full px-4 py-2 bg-[color:var(--surface-strong)] text-[color:var(--text)] rounded-lg font-medium hover:bg-[color:var(--surface-strong)]/80 transition-colors"
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
