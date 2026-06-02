<script lang="ts">
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import DashboardHeader from "$lib/components/DashboardHeader.svelte";
  import PageHeader from "$lib/components/ui/PageHeader.svelte";
  import Surface from "$lib/components/ui/Surface.svelte";
  import { notifications } from "$lib/stores/notifications";
  import type {
    FormElement,
    Theme,
    ThemeAnchor,
    ThemeDecoration,
    ThemeZone,
  } from "$lib/types";
  import {
    buildThemeLayoutFromDecorations,
    normalizeThemeScene,
    toRawImageUrl,
  } from "$lib/utils/themeLayout";

  let formId = $derived($page.url.searchParams.get("formId"));

  let activeTab = $state<"design" | "code">("design");
  let currentSlide = $state(0);
  let mockupMode = $state<"desktop" | "mobile">("desktop");
  let previewFrame = $state<HTMLIFrameElement | null>(null);
  let previewReady = $state(false);

  let themeName = $state("");
  let themeDesc = $state("");
  let fontUrl = $state("Outfit");
  let borderRadius = $state(16);
  let inputRadius = $state(8);
  let editingThemeId = $state<string | null>(null);

  let decorations = $state<ThemeDecoration[]>([]);
  let newAssetName = $state("");
  let newAssetUrl = $state("");

  let colors = $state({
    primary: "#8b5cf6",
    background: "#ffffff",
    text: "#1e293b",
    accent: "#8b5cf6",
    cardBg: "#ffffff",
    cardBorder: "#e2e8f0",
    inputBg: "#ffffff",
    buttonBg: "#8b5cf6",
    buttonText: "#ffffff",
    footerImageUrl: "",
    footerImageHeight: 88,
  });

  let customCss = $state("");
  let customJs = $state("");
  let customHtmlHeader = $state("");
  let customHtmlFooter = $state("");

  let customThemes = $state<any[]>([]);
  let loadingThemes = $state(true);
  let savingTheme = $state(false);

  const googleFontsPresets = [
    "Outfit",
    "Inter",
    "Sora",
    "JetBrains Mono",
    "Syne",
    "Playfair Display",
    "Press Start 2P",
    "sans-serif",
  ];

  const zoneOptions: ThemeZone[] = [
    "header",
    "content",
    "decoration",
    "footer",
    "navigation",
  ];

  const anchorOptions: ThemeAnchor[] = [
    "header",
    "question-area",
    "content",
    "safe-area",
    "footer",
    "bottom-navigation",
    "screen-edge",
  ];

  const sampleQuestions: FormElement[] = [
    {
      id: "sample-text",
      type: "text",
      title: "What is your full name?",
      required: true,
      placeholder: "Type your answer here...",
      helperText: "This question tests standard single-line inputs.",
    },
    {
      id: "sample-long-text",
      type: "long-text",
      title: "Describe your background and what brings you here today.",
      required: true,
      helperText:
        "Longer content should push the question zone naturally without overlapping decorative assets.",
    },
    {
      id: "sample-email",
      type: "email",
      title: "What email address should we use for updates?",
      required: true,
      placeholder: "name@example.com",
    },
    {
      id: "sample-phone",
      type: "phone",
      title: "What phone number should we contact if plans change?",
      required: true,
    },
    {
      id: "sample-date",
      type: "date",
      title: "Which date works best for you?",
      required: true,
    },
    {
      id: "sample-mc",
      type: "multiple-choice",
      title: "Which format do you prefer?",
      required: true,
      options: ["In person", "Remote", "Hybrid"],
    },
    {
      id: "sample-checkbox",
      type: "checkboxes",
      title: "Which topics are relevant to you?",
      required: true,
      options: [
        "Automation",
        "Data collection",
        "Event operations",
        "Design systems",
      ],
      helperText:
        "Validation copy and multiple selections should not collide with decorative layers.",
    },
    {
      id: "sample-dropdown",
      type: "dropdown",
      title: "Choose your team size.",
      required: true,
      options: ["Solo", "2-5", "6-10", "10+"],
    },
    {
      id: "sample-yesno",
      type: "yes-no",
      title: "Do you need on-site assistance?",
      required: true,
      options: ["Yes", "No"],
    },
    {
      id: "sample-rating",
      type: "rating",
      title: "How smooth did this theme feel to use?",
      required: true,
    },
    {
      id: "sample-image",
      type: "image-upload",
      title: "Upload a reference image.",
      required: true,
      acceptedFormats: "image/png,image/jpeg,image/webp",
      maxFileSize: 5,
    },
  ];

  onMount(() => {
    void fetchThemes();
    if (formId) {
      void fetchFormTheme();
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "PREVIEW_IFRAME_READY") {
        previewReady = true;
        postPreview();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  });

  function applyThemeState(theme: any) {
    themeName = theme.name || "";
    themeDesc = theme.description || "";
    fontUrl = theme.fontUrl || theme.font_url || "Outfit";
    borderRadius = theme.border_radius ?? 16;
    inputRadius = theme.input_radius ?? 8;
    customCss = theme.customCss || theme.custom_css || "";
    customJs = theme.customJs || theme.custom_js || "";
    customHtmlHeader = theme.customHtmlHeader || theme.custom_html_header || "";
    customHtmlFooter = theme.customHtmlFooter || theme.custom_html_footer || "";

    const themeColors = theme.colors || {};
    colors = {
      ...colors,
      ...themeColors,
      footerImageUrl:
        theme.layout?.footer?.imageUrl ||
        themeColors.layout?.footer?.imageUrl ||
        themeColors.footerImageUrl ||
        "",
      footerImageHeight:
        theme.layout?.footer?.height ||
        themeColors.layout?.footer?.height ||
        themeColors.footerImageHeight ||
        88,
    };

    decorations = normalizeThemeScene(theme as Theme).decorations;
    editingThemeId = theme.id || null;
  }

  async function fetchThemes() {
    try {
      loadingThemes = true;
      const res = await fetch("/api/themes");
      if (res.ok) {
        const data = await res.json();
        customThemes = data.filter((theme: any) => !theme.is_public);
      }
    } catch (error) {
      console.error("Error fetching themes:", error);
    } finally {
      loadingThemes = false;
    }
  }

  async function fetchFormTheme() {
    try {
      const res = await fetch(`/api/forms?formId=${formId}`);
      if (!res.ok) return;
      const form = await res.json();
      if (form.theme) {
        applyThemeState(form.theme);
      }
    } catch (error) {
      console.error("Error loading form theme:", error);
    }
  }

  function createThemePayload(): Theme {
    const footer = {
      imageUrl: colors.footerImageUrl,
      height: colors.footerImageHeight,
    };
    const layout = buildThemeLayoutFromDecorations(decorations, footer);

    return {
      id: editingThemeId || "theme-builder-preview",
      name: themeName || "Custom Theme Draft",
      description: themeDesc,
      fontUrl,
      border_radius: borderRadius,
      input_radius: inputRadius,
      customCss,
      customJs,
      customHtmlHeader,
      customHtmlFooter,
      layout,
      colors: {
        ...colors,
        floatingAssets: [],
        footerImageUrl: colors.footerImageUrl,
        footerImageHeight: colors.footerImageHeight,
        layout,
      },
    };
  }

  function buildPreviewData() {
    return {
      id: formId || "theme-builder-preview",
      title: "Theme Builder Preview",
      questions: sampleQuestions,
      closed: false,
      backgroundType: "color",
      backgroundColor: colors.background,
      backgroundImage: "",
      globalTextColor: colors.text,
      theme: createThemePayload(),
      enable_device_tracking: false,
      anonymous_voting: false,
    };
  }

  function clonePreviewData() {
    return JSON.parse(JSON.stringify(buildPreviewData()));
  }

  function postPreview() {
    if (!browser || !previewReady || !previewFrame?.contentWindow) return;
    previewFrame.contentWindow.postMessage(
      {
        type: "UPDATE_FORM_PREVIEW",
        data: clonePreviewData(),
      },
      window.location.origin,
    );
  }

  $effect(() => {
    if (!browser) return;
    void previewFrame;
    void previewReady;
    void mockupMode;
    void themeName;
    void themeDesc;
    void fontUrl;
    void borderRadius;
    void inputRadius;
    void decorations;
    void colors;
    void customCss;
    void customJs;
    void customHtmlHeader;
    void customHtmlFooter;
    void currentSlide;
    postPreview();
  });

  function addDecoration() {
    if (!newAssetUrl.trim()) return;

    decorations = [
      ...decorations,
      {
        id: crypto.randomUUID(),
        name: newAssetName.trim() || `Decoration ${decorations.length + 1}`,
        url: toRawImageUrl(newAssetUrl.trim()),
        zone: "footer",
        anchor: "footer",
        alignX: "left",
        alignY: "bottom",
        offsetX: 32,
        offsetY: -12,
        width: 18,
        opacity: 1,
        rotate: 0,
      },
    ];

    newAssetName = "";
    newAssetUrl = "";
  }

  function updateDecoration(index: number, patch: Partial<ThemeDecoration>) {
    decorations = decorations.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item,
    );
  }

  async function saveTheme() {
    if (!themeName.trim()) {
      notifications.add("Theme name is required", "error");
      return;
    }

    const theme = createThemePayload();

    try {
      savingTheme = true;
      const payload = {
        id: editingThemeId,
        name: theme.name,
        description: theme.description,
        font_url: theme.fontUrl,
        custom_css: theme.customCss,
        custom_js: theme.customJs,
        custom_html_header: theme.customHtmlHeader,
        custom_html_footer: theme.customHtmlFooter,
        colors: theme.colors,
        border_radius: theme.border_radius,
        input_radius: theme.input_radius,
      };

      const resTheme = await fetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resTheme.ok) {
        throw new Error(await resTheme.text());
      }

      const result = await resTheme.json();
      editingThemeId = result.themeId;

      if (formId) {
        const resForm = await fetch(`/api/forms?formId=${formId}`);
        if (resForm.ok) {
          const form = await resForm.json();
          await fetch("/api/forms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: formId,
              title: form.title,
              slug: form.slug,
              published: form.published,
              closed: form.closed,
              background_type: "color",
              background_color: colors.background,
              global_text_color: colors.text,
              questions: form.questions || [],
              theme: {
                ...theme,
                id: result.themeId,
              },
            }),
          });
        }
      }

      notifications.add("Theme saved", "success");
      await fetchThemes();
    } catch (error: any) {
      console.error("Error saving theme:", error);
      notifications.add(`Failed to save theme: ${error.message}`, "error");
    } finally {
      savingTheme = false;
    }
  }

  async function deleteTheme(themeId: string) {
    if (!confirm("Delete this theme preset?")) return;

    try {
      const res = await fetch(`/api/themes?id=${themeId}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      customThemes = customThemes.filter((theme) => theme.id !== themeId);
      notifications.add("Theme deleted", "success");
    } catch (error) {
      console.error("Error deleting theme:", error);
      notifications.add("Failed to delete theme", "error");
    }
  }
</script>

<svelte:head>
  <title>Theme Builder | Quill</title>
</svelte:head>

<div class="app-shell bg-[color:var(--bg)] min-h-screen text-[color:var(--text)]">
  <DashboardHeader />

  <main class="page-container page-stack section-stack py-8">
    <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <PageHeader
        eyebrow="Theme Workspace"
        title="Responsive Theme Builder"
        description="Design themes with anchors, zones, and constraints. The preview uses the same form renderer as runtime."
      />

      {#if formId}
        <a href="/form-builder/{formId}" class="btn btn-secondary">Back to Builder</a>
      {/if}
    </div>

    <div class="grid gap-8 lg:grid-cols-[440px_1fr] items-start">
      <section class="space-y-6">
        <Surface className="panel-section space-y-6">
          <div class="segmented w-full">
            <button
              type="button"
              class="segmented-item flex-1"
              data-state={activeTab === "design" ? "active" : "inactive"}
              onclick={() => (activeTab = "design")}
            >
              Visual
            </button>
            <button
              type="button"
              class="segmented-item flex-1"
              data-state={activeTab === "code" ? "active" : "inactive"}
              onclick={() => (activeTab = "code")}
            >
              Code
            </button>
          </div>

          {#if activeTab === "design"}
            <div class="space-y-5">
              <div class="grid grid-cols-2 gap-3">
                <label class="space-y-1 text-xs font-medium">
                  <span>Background</span>
                  <input type="color" bind:value={colors.background} class="h-10 w-full" />
                </label>
                <label class="space-y-1 text-xs font-medium">
                  <span>Text</span>
                  <input type="color" bind:value={colors.text} class="h-10 w-full" />
                </label>
                <label class="space-y-1 text-xs font-medium">
                  <span>Accent</span>
                  <input type="color" bind:value={colors.accent} class="h-10 w-full" />
                </label>
                <label class="space-y-1 text-xs font-medium">
                  <span>Button</span>
                  <input type="color" bind:value={colors.buttonBg} class="h-10 w-full" />
                </label>
              </div>

              <label class="space-y-1 text-xs font-medium block">
                <span>Font</span>
                <select bind:value={fontUrl} class="field w-full text-xs">
                  {#each googleFontsPresets as font}
                    <option value={font}>{font}</option>
                  {/each}
                </select>
              </label>

              <div class="space-y-3">
                <label class="space-y-1 text-xs font-medium block">
                  <span>Card Radius: {borderRadius}px</span>
                  <input type="range" min="0" max="48" bind:value={borderRadius} class="w-full" />
                </label>
                <label class="space-y-1 text-xs font-medium block">
                  <span>Input Radius: {inputRadius}px</span>
                  <input type="range" min="0" max="32" bind:value={inputRadius} class="w-full" />
                </label>
              </div>

              <div class="space-y-3 border-t border-[color:var(--border-subtle)] pt-4">
                <div class="text-xs font-semibold uppercase tracking-wider muted">Footer Zone</div>
                <input
                  type="text"
                  bind:value={colors.footerImageUrl}
                  placeholder="Footer image URL"
                  class="field w-full text-xs"
                />
                <label class="space-y-1 text-xs font-medium block">
                  <span>Footer Height: {colors.footerImageHeight}px</span>
                  <input type="range" min="32" max="200" bind:value={colors.footerImageHeight} class="w-full" />
                </label>
              </div>

              <div class="space-y-3 border-t border-[color:var(--border-subtle)] pt-4">
                <div class="text-xs font-semibold uppercase tracking-wider muted">Decorations</div>
                <input
                  type="text"
                  bind:value={newAssetName}
                  placeholder="Decoration name"
                  class="field w-full text-xs"
                />
                <div class="flex gap-2">
                  <input
                    type="text"
                    bind:value={newAssetUrl}
                    placeholder="Decoration asset URL"
                    class="field flex-1 text-xs"
                  />
                  <button type="button" class="btn btn-secondary" onclick={addDecoration}>Add</button>
                </div>

                {#if decorations.length === 0}
                  <p class="text-xs muted">
                    Add assets and anchor them to zones like `footer`, `question-area`, or `safe-area`.
                  </p>
                {/if}

                <div class="space-y-4">
                  {#each decorations as decoration, index (decoration.id)}
                    <div class="rounded-[12px] border border-[color:var(--border)] p-3 space-y-3">
                      <div class="flex items-center justify-between gap-3">
                        <div class="min-w-0">
                          <div class="truncate text-xs font-semibold">{decoration.name}</div>
                          <div class="truncate text-[11px] muted">{decoration.url}</div>
                        </div>
                        <button
                          type="button"
                          class="text-xs text-[color:var(--danger)]"
                          onclick={() => (decorations = decorations.filter((_, itemIndex) => itemIndex !== index))}
                        >
                          Remove
                        </button>
                      </div>

                      <div class="grid grid-cols-2 gap-2">
                        <label class="space-y-1 text-xs">
                          <span>Zone</span>
                          <select
                            class="field w-full text-xs"
                            value={decoration.zone || "decoration"}
                            onchange={(event) => updateDecoration(index, { zone: event.currentTarget.value as ThemeZone })}
                          >
                            {#each zoneOptions as zone}
                              <option value={zone}>{zone}</option>
                            {/each}
                          </select>
                        </label>
                        <label class="space-y-1 text-xs">
                          <span>Anchor</span>
                          <select
                            class="field w-full text-xs"
                            value={decoration.anchor || "safe-area"}
                            onchange={(event) => updateDecoration(index, { anchor: event.currentTarget.value as ThemeAnchor })}
                          >
                            {#each anchorOptions as anchor}
                              <option value={anchor}>{anchor}</option>
                            {/each}
                          </select>
                        </label>
                        <label class="space-y-1 text-xs">
                          <span>Align X</span>
                          <select
                            class="field w-full text-xs"
                            value={decoration.alignX || "center"}
                            onchange={(event) => updateDecoration(index, { alignX: event.currentTarget.value as ThemeDecoration["alignX"] })}
                          >
                            <option value="left">left</option>
                            <option value="center">center</option>
                            <option value="right">right</option>
                          </select>
                        </label>
                        <label class="space-y-1 text-xs">
                          <span>Align Y</span>
                          <select
                            class="field w-full text-xs"
                            value={decoration.alignY || "middle"}
                            onchange={(event) => updateDecoration(index, { alignY: event.currentTarget.value as ThemeDecoration["alignY"] })}
                          >
                            <option value="top">top</option>
                            <option value="middle">middle</option>
                            <option value="bottom">bottom</option>
                          </select>
                        </label>
                        <label class="space-y-1 text-xs">
                          <span>Offset X</span>
                          <input
                            type="number"
                            class="field w-full text-xs"
                            value={decoration.offsetX ?? 0}
                            onchange={(event) => updateDecoration(index, { offsetX: Number(event.currentTarget.value) })}
                          />
                        </label>
                        <label class="space-y-1 text-xs">
                          <span>Offset Y</span>
                          <input
                            type="number"
                            class="field w-full text-xs"
                            value={decoration.offsetY ?? 0}
                            onchange={(event) => updateDecoration(index, { offsetY: Number(event.currentTarget.value) })}
                          />
                        </label>
                        <label class="space-y-1 text-xs">
                          <span>Width (%)</span>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            class="field w-full text-xs"
                            value={decoration.width ?? 18}
                            onchange={(event) => updateDecoration(index, { width: Number(event.currentTarget.value) })}
                          />
                        </label>
                        <label class="space-y-1 text-xs">
                          <span>Opacity</span>
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            class="field w-full text-xs"
                            value={decoration.opacity ?? 1}
                            onchange={(event) => updateDecoration(index, { opacity: Number(event.currentTarget.value) })}
                          />
                        </label>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {:else}
            <div class="space-y-4">
              <label class="space-y-1 text-xs font-medium block">
                <span>Custom HTML Header</span>
                <textarea bind:value={customHtmlHeader} rows="4" class="field w-full text-xs font-mono"></textarea>
              </label>
              <label class="space-y-1 text-xs font-medium block">
                <span>Custom HTML Footer</span>
                <textarea bind:value={customHtmlFooter} rows="4" class="field w-full text-xs font-mono"></textarea>
              </label>
              <label class="space-y-1 text-xs font-medium block">
                <span>Custom CSS</span>
                <textarea bind:value={customCss} rows="8" class="field w-full text-xs font-mono"></textarea>
              </label>
              <label class="space-y-1 text-xs font-medium block">
                <span>Custom JavaScript</span>
                <textarea bind:value={customJs} rows="4" class="field w-full text-xs font-mono"></textarea>
              </label>
            </div>
          {/if}

          <div class="border-t border-[color:var(--border-subtle)] pt-5 space-y-3">
            <input type="text" bind:value={themeName} placeholder="Theme name" class="field w-full text-xs" />
            <input type="text" bind:value={themeDesc} placeholder="Description" class="field w-full text-xs" />
            <button class="btn btn-primary w-full" onclick={saveTheme} disabled={savingTheme}>
              {savingTheme ? "Saving..." : editingThemeId ? "Update Theme" : "Save Theme"}
            </button>
          </div>
        </Surface>

        <Surface className="panel-section space-y-3">
          <div class="text-xs font-semibold uppercase tracking-wider muted">Saved Themes</div>
          {#if loadingThemes}
            <p class="text-xs muted">Loading themes...</p>
          {:else if customThemes.length === 0}
            <p class="text-xs muted">No saved themes yet.</p>
          {:else}
            <div class="space-y-2">
              {#each customThemes as theme}
                <div class="flex items-center justify-between gap-3 rounded-[10px] border border-[color:var(--border)] p-3">
                  <button type="button" class="min-w-0 text-left" onclick={() => applyThemeState(theme)}>
                    <div class="truncate text-sm font-semibold">{theme.name}</div>
                    <div class="truncate text-xs muted">{theme.description || "No description"}</div>
                  </button>
                  <button type="button" class="text-xs text-[color:var(--danger)]" onclick={() => deleteTheme(theme.id)}>
                    Delete
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </Surface>
      </section>

      <section class="h-full flex flex-col">
        <Surface className="panel-section flex-1 flex flex-col p-0 overflow-hidden">
          <div class="border-b border-[color:var(--border)] px-5 py-3 flex items-center justify-between gap-4 bg-[color:var(--surface-muted)]">
            <div class="flex items-center gap-3 min-w-0">
                <select bind:value={currentSlide} class="field text-xs">
                  {#each sampleQuestions as question, index}
                    <option value={index}>{index + 1}. {"type" in question ? question.type : "block"}</option>
                  {/each}
                </select>
              <span class="text-xs muted">Runtime preview</span>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                data-active={mockupMode === "desktop"}
                onclick={() => (mockupMode = "desktop")}
              >
                Desktop
              </button>
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                data-active={mockupMode === "mobile"}
                onclick={() => (mockupMode = "mobile")}
              >
                Mobile
              </button>
            </div>
          </div>

          <div class={mockupMode === "mobile" ? "flex-1 bg-slate-100 flex items-center justify-center p-6" : "flex-1 bg-[color:var(--surface-muted)] p-4"}>
            <div class={mockupMode === "mobile" ? "w-[390px] h-[844px] max-w-full rounded-[38px] border-[12px] border-slate-900 overflow-hidden shadow-2xl bg-white" : "h-[860px] w-full rounded-[20px] overflow-hidden border border-[color:var(--border)] bg-white"}>
              <iframe
                bind:this={previewFrame}
                src="/preview/{formId || 'theme-builder'}"
                title="Theme preview"
                class="h-full w-full border-0"
                onload={postPreview}
              ></iframe>
            </div>
          </div>
        </Surface>
      </section>
    </div>
  </main>
</div>
