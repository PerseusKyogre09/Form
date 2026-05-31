<!-- src/routes/theme-builder/+page.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { notifications } from "$lib/stores/notifications";
  import favicon from "$lib/assets/favicon.svg";
  import DashboardHeader from "$lib/components/DashboardHeader.svelte";
  import Surface from "$lib/components/ui/Surface.svelte";
  import PageHeader from "$lib/components/ui/PageHeader.svelte";

  let formId = $derived($page.url.searchParams.get("formId"));

  // Interactive Tab and slide selectors
  let activeTab = $state<"hand" | "code">("hand");
  let currentSlide = $state(0); // Index from 0 to 11

  // Core visual and code states
  let themeName = $state("");
  let themeDesc = $state("");
  let fontUrl = $state("Outfit");
  let borderRadius = $state(16);
  let inputRadius = $state(8);
  let editingThemeId = $state<string | null>(null);

  // Floating decal stickers
  let floatingAssets = $state<any[]>([]);
  let newAssetName = $state("");
  let newAssetUrl = $state("");
  let newAssetWidth = $state(15); // Percentage width default (15% of viewport)

  let mockupMode = $state<'desktop' | 'mobile'>('desktop');

  // Viewport tracking for dragging calculation
  let viewportElement = $state<HTMLElement | null>(null);
  let activeDragIndex = $state<number | null>(null);
  let dragStartMouseX = 0;
  let dragStartMouseY = 0;
  let dragStartPercentX = 0;
  let dragStartPercentY = 0;

  // Visual drag-resizer states
  let activeResizeIndex = $state<number | null>(null);
  let resizeStartMouseX = 0;
  let resizeStartWidthPercent = 0;

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
    footerImageHeight: 80
  });

  let customCss = $state("");
  let customJs = $state("");
  let customHtmlHeader = $state("");
  let customHtmlFooter = $state("");

  // Existing custom themes listing
  let customThemes = $state<any[]>([]);
  let loadingThemes = $state(true);
  let savingTheme = $state(false);

  const googleFontsPresets = [
    "Outfit",
    "Inter",
    "Sora",
    "JetBrains Mono",
    "Syne",
    "Press Start 2P",
    "Playfair Display",
    "Outfit",
    "sans-serif"
  ];

  onMount(async () => {
    await fetchThemes();
    if (formId) {
      await fetchFormTheme();
    }
  });

  async function fetchThemes() {
    try {
      loadingThemes = true;
      const res = await fetch("/api/themes");
      if (res.ok) {
        const data = await res.json();
        // filter for user custom themes
        customThemes = data.filter((t: any) => !t.is_public);
      }
    } catch (err) {
      console.error("Error fetching custom themes:", err);
    } finally {
      loadingThemes = false;
    }
  }

  async function fetchFormTheme() {
    try {
      const res = await fetch(`/api/forms?formId=${formId}`);
      if (res.ok) {
        const form = await res.json();
        if (form.theme) {
          const theme = form.theme;
          if (theme.name && theme.name !== "Custom Theme Draft") {
            themeName = theme.name;
          }
          if (theme.description) {
            themeDesc = theme.description;
          }
          if (theme.fontUrl) fontUrl = theme.fontUrl;
          if (theme.border_radius !== undefined) borderRadius = theme.border_radius;
          if (theme.input_radius !== undefined) inputRadius = theme.input_radius;
          if (theme.customCss) customCss = theme.customCss;
          if (theme.customJs) customJs = theme.customJs;
          if (theme.customHtmlHeader) customHtmlHeader = theme.customHtmlHeader;
          if (theme.customHtmlFooter) customHtmlFooter = theme.customHtmlFooter;
          if (theme.colors) {
            // Unpack custom color set and floating decals
            const { floatingAssets: loadedAssets, ...loadedColors } = theme.colors;
            colors = { ...colors, ...loadedColors };
            if (loadedAssets && Array.isArray(loadedAssets)) {
              floatingAssets = loadedAssets;
            }
          }
          if (theme.id) {
            editingThemeId = theme.id;
          }
        }
      }
    } catch (err) {
      console.error("Error loading form theme:", err);
    }
  }

  async function saveTheme() {
    if (!themeName.trim()) {
      notifications.add("Please provide a name for your custom theme", "error");
      return;
    }

    try {
      savingTheme = true;
      const themePayload: any = {
        name: themeName,
        description: themeDesc,
        font_url: fontUrl,
        custom_css: customCss,
        custom_js: customJs,
        custom_html_header: customHtmlHeader,
        custom_html_footer: customHtmlFooter,
        colors: { ...colors, floatingAssets }, // Sync decals inside color structure
        border_radius: borderRadius,
        input_radius: inputRadius,
      };

      if (editingThemeId) {
        themePayload.id = editingThemeId;
      }

      // Save reusable theme preset
      const resTheme = await fetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(themePayload),
      });

      if (!resTheme.ok) {
        const errText = await resTheme.text();
        throw new Error(errText);
      }

      const result = await resTheme.json();
      editingThemeId = result.themeId; // Keep track of the active theme ID!
      notifications.add("Custom Theme Saved Successfully!", "success");

      // If we came from a specific form, sync this theme to the form database!
      if (formId) {
        // Fetch current form metadata first
        const resFormGet = await fetch(`/api/forms?formId=${formId}`);
        if (resFormGet.ok) {
          const form = await resFormGet.json();
          
          // Update the form's theme settings
          const formUpdatePayload = {
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
              id: result.themeId,
              name: themeName,
              description: themeDesc,
              fontUrl: fontUrl,
              colors: { ...colors, floatingAssets },
              border_radius: borderRadius,
              input_radius: inputRadius,
              customCss: customCss,
              customJs: customJs,
              customHtmlHeader: customHtmlHeader,
              customHtmlFooter: customHtmlFooter,
            }
          };

          const resFormUpdate = await fetch("/api/forms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formUpdatePayload),
          });

          if (resFormUpdate.ok) {
            notifications.add("Form layout updated to use new theme!", "success");
          }
        }
      }

      await fetchThemes();
    } catch (err: any) {
      console.error("Error saving theme:", err);
      notifications.add("Failed to save theme: " + err.message, "error");
    } finally {
      savingTheme = false;
    }
  }

  async function deleteTheme(themeId: string, event: Event) {
    event.stopPropagation();
    if (!confirm("Are you sure you want to delete this custom theme template?")) return;

    try {
      const res = await fetch(`/api/themes?id=${themeId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        notifications.add("Theme template deleted successfully", "success");
        await fetchThemes();
      } else {
        const err = await res.text();
        notifications.add("Failed to delete theme: " + err, "error");
      }
    } catch (err) {
      console.error("Error deleting theme:", err);
      notifications.add("Failed to delete theme", "error");
    }
  }

  function applyExistingTheme(theme: any) {
    themeName = theme.name;
    themeDesc = theme.description || "";
    if (theme.font_url) fontUrl = theme.font_url;
    if (theme.border_radius !== null && theme.border_radius !== undefined) borderRadius = theme.border_radius;
    if (theme.input_radius !== null && theme.input_radius !== undefined) inputRadius = theme.input_radius;
    if (theme.custom_css) customCss = theme.custom_css;
    if (theme.custom_js) customJs = theme.custom_js;
    if (theme.custom_html_header) customHtmlHeader = theme.custom_html_header;
    if (theme.custom_html_footer) customHtmlFooter = theme.custom_html_footer;
    if (theme.colors) {
      const { floatingAssets: loadedAssets, ...loadedColors } = theme.colors;
      colors = { ...colors, ...loadedColors };
      if (loadedAssets && Array.isArray(loadedAssets)) {
        floatingAssets = loadedAssets;
      } else {
        floatingAssets = [];
      }
    }
    if (theme.id) {
      editingThemeId = theme.id;
    }
    notifications.add(`Applied ${theme.name} variables to editor`, "success");
  }

  // Decal drag handlers
  function startAssetDrag(index: number, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    activeDragIndex = index;
    dragStartMouseX = e.clientX;
    dragStartMouseY = e.clientY;
    
    if (mockupMode === 'mobile') {
      dragStartPercentX = floatingAssets[index].mobileX !== undefined ? floatingAssets[index].mobileX : floatingAssets[index].x;
      dragStartPercentY = floatingAssets[index].mobileY !== undefined ? floatingAssets[index].mobileY : floatingAssets[index].y;
    } else {
      dragStartPercentX = floatingAssets[index].x;
      dragStartPercentY = floatingAssets[index].y;
    }

    window.addEventListener("mousemove", handleAssetDrag);
    window.addEventListener("mouseup", stopAssetDrag);
  }

  function handleAssetDrag(e: MouseEvent) {
    if (activeDragIndex === null || !viewportElement) return;

    const rect = viewportElement.getBoundingClientRect();
    const deltaX = e.clientX - dragStartMouseX;
    const deltaY = e.clientY - dragStartMouseY;

    // Convert pixel coordinates to viewport relative percentages
    const percentDeltaX = (deltaX / rect.width) * 100;
    const percentDeltaY = (deltaY / rect.height) * 100;

    let nextX = Math.max(0, Math.min(100, dragStartPercentX + percentDeltaX));
    let nextY = Math.max(0, Math.min(100, dragStartPercentY + percentDeltaY));

    // Smooth rounding for precise percentages
    if (mockupMode === 'mobile') {
      floatingAssets[activeDragIndex].mobileX = Math.round(nextX * 10) / 10;
      floatingAssets[activeDragIndex].mobileY = Math.round(nextY * 10) / 10;
    } else {
      floatingAssets[activeDragIndex].x = Math.round(nextX * 10) / 10;
      floatingAssets[activeDragIndex].y = Math.round(nextY * 10) / 10;
    }
  }

  function stopAssetDrag() {
    activeDragIndex = null;
    window.removeEventListener("mousemove", handleAssetDrag);
    window.removeEventListener("mouseup", stopAssetDrag);
  }

  // Interactive Drag Resizing Handlers
  function startAssetResize(index: number, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    activeResizeIndex = index;
    resizeStartMouseX = e.clientX;

    let w = mockupMode === 'mobile' 
      ? (floatingAssets[index].mobileWidth !== undefined ? floatingAssets[index].mobileWidth : floatingAssets[index].width)
      : floatingAssets[index].width;
      
    if (typeof w !== 'number' || w > 100) {
      if (viewportElement) {
        const rect = viewportElement.getBoundingClientRect();
        w = Math.round((Number(w) / rect.width) * 100);
      } else {
        w = 15;
      }
    }
    resizeStartWidthPercent = w;

    window.addEventListener("mousemove", handleAssetResize);
    window.addEventListener("mouseup", stopAssetResize);
  }

  function handleAssetResize(e: MouseEvent) {
    if (activeResizeIndex === null || !viewportElement) return;

    const rect = viewportElement.getBoundingClientRect();
    const deltaX = e.clientX - resizeStartMouseX;
    const percentDeltaX = (deltaX / rect.width) * 100;

    // Centered translation pulls resize symmetrically (scale factor of 2)
    let nextWidth = Math.max(3, Math.min(80, resizeStartWidthPercent + (percentDeltaX * 2)));
    if (mockupMode === 'mobile') {
      floatingAssets[activeResizeIndex].mobileWidth = Math.round(nextWidth * 10) / 10;
    } else {
      floatingAssets[activeResizeIndex].width = Math.round(nextWidth * 10) / 10;
    }
  }

  function stopAssetResize() {
    activeResizeIndex = null;
    window.removeEventListener("mousemove", handleAssetResize);
    window.removeEventListener("mouseup", stopAssetResize);
  }
</script>

<svelte:head>
  <title>Theme Builder | Quill</title>
</svelte:head>

<!-- Inject fonts & dynamic custom style variables safely scoped to preview viewport -->
<svelte:element this="style">
  {`
    @import url('https://fonts.googleapis.com/css2?family=${fontUrl === "sans-serif" ? "Inter" : fontUrl}&display=swap');
    
    .mock-viewport {
      background-color: ${colors.background} !important;
      color: ${colors.text} !important;
      font-family: '${fontUrl}', sans-serif !important;
    }
    
    .mock-card {
      background-color: ${colors.cardBg} !important;
      border-color: ${colors.cardBorder} !important;
      border-radius: ${borderRadius}px !important;
      color: ${colors.text} !important;
    }
    
    .mock-input {
      background-color: ${colors.inputBg} !important;
      border-color: ${colors.cardBorder} !important;
      border-radius: ${inputRadius}px !important;
      color: ${colors.text} !important;
    }
    
    .mock-btn {
      background-color: ${colors.buttonBg} !important;
      color: ${colors.buttonText} !important;
      border-radius: ${inputRadius}px !important;
    }
    
    ${customCss}
  `}
</svelte:element>

<div class="app-shell bg-[color:var(--bg)] min-h-screen text-[color:var(--text)]">
  <!-- Native Website Dashboard Header -->
  <DashboardHeader />

  <main class="page-container page-stack section-stack py-8">
    
    <!-- Header Block in alignment with Quill designs -->
    <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <PageHeader
        eyebrow="Theme Workspace"
        title="Custom Theme Builder"
        description="Design personalized form variables, headers, or inject scoped HTML/CSS/JS reusable across any forms."
      />

      <div class="flex items-center gap-2">
        {#if formId}
          <a
            href="/form-builder/{formId}"
            class="btn btn-secondary flex items-center gap-2"
          >
            <i class="fas fa-arrow-left text-xs"></i>
            <span>Back to Builder</span>
          </a>
        {/if}
      </div>
    </div>

    <!-- Main Workspace Studio Grid layout -->
    <div class="grid gap-8 lg:grid-cols-[440px_1fr] items-start">
      
      <!-- Control Parameter Panel on the Left -->
      <section class="space-y-6">
        <Surface className="panel-section space-y-6">
          
          <div class="border-b border-[color:var(--border-subtle)] pb-4">
            <h3 class="text-base font-semibold tracking-tight text-[color:var(--text)] flex items-center gap-2">
              <i class="fas fa-magic text-[color:var(--accent)]"></i>
              Theme Parameters
            </h3>
            <p class="text-xs muted mt-1">Configure layout variables or add custom code blocks.</p>
          </div>

          <!-- Dual tab Visual / Code selector -->
          <div class="segmented w-full">
            <button
              type="button"
              class="segmented-item flex-1"
              data-state={activeTab === "hand" ? "active" : "inactive"}
              onclick={() => (activeTab = "hand")}
            >
              <i class="fas fa-palette text-xs mr-1"></i> Visual Design
            </button>
            <button
              type="button"
              class="segmented-item flex-1"
              data-state={activeTab === "code" ? "active" : "inactive"}
              onclick={() => (activeTab = "code")}
            >
              <i class="fas fa-code text-xs mr-1"></i> Code Editor
            </button>
          </div>

          {#if activeTab === "hand"}
            <!-- Hand-Design UI controls -->
            <div class="space-y-5">
              
              <div class="space-y-3">
                <span class="text-xs font-semibold uppercase tracking-wider muted">Color Palette</span>
                
                <div class="grid grid-cols-2 gap-3">
                  <div class="flex items-center justify-between gap-2 p-2 rounded-[10px] border border-[color:var(--border)] surface-strong bg-[color:var(--surface)]">
                    <span class="text-xs font-medium text-[color:var(--text)]">Background</span>
                    <input type="color" bind:value={colors.background} class="h-6 w-8 cursor-pointer rounded border border-[color:var(--border)] bg-transparent p-0" />
                  </div>
                  <div class="flex items-center justify-between gap-2 p-2 rounded-[10px] border border-[color:var(--border)] surface-strong bg-[color:var(--surface)]">
                    <span class="text-xs font-medium text-[color:var(--text)]">Text Color</span>
                    <input type="color" bind:value={colors.text} class="h-6 w-8 cursor-pointer rounded border border-[color:var(--border)] bg-transparent p-0" />
                  </div>
                  <div class="flex items-center justify-between gap-2 p-2 rounded-[10px] border border-[color:var(--border)] surface-strong bg-[color:var(--surface)]">
                    <span class="text-xs font-medium text-[color:var(--text)]">Accent Color</span>
                    <input type="color" bind:value={colors.accent} class="h-6 w-8 cursor-pointer rounded border border-[color:var(--border)] bg-transparent p-0" />
                  </div>
                  <div class="flex items-center justify-between gap-2 p-2 rounded-[10px] border border-[color:var(--border)] surface-strong bg-[color:var(--surface)]">
                    <span class="text-xs font-medium text-[color:var(--text)]">Card Overlay</span>
                    <input type="color" bind:value={colors.cardBg} class="h-6 w-8 cursor-pointer rounded border border-[color:var(--border)] bg-transparent p-0" />
                  </div>
                  <div class="flex items-center justify-between gap-2 p-2 rounded-[10px] border border-[color:var(--border)] surface-strong bg-[color:var(--surface)]">
                    <span class="text-xs font-medium text-[color:var(--text)]">Card Border</span>
                    <input type="color" bind:value={colors.cardBorder} class="h-6 w-8 cursor-pointer rounded border border-[color:var(--border)] bg-transparent p-0" />
                  </div>
                  <div class="flex items-center justify-between gap-2 p-2 rounded-[10px] border border-[color:var(--border)] surface-strong bg-[color:var(--surface)]">
                    <span class="text-xs font-medium text-[color:var(--text)]">Input Background</span>
                    <input type="color" bind:value={colors.inputBg} class="h-6 w-8 cursor-pointer rounded border border-[color:var(--border)] bg-transparent p-0" />
                  </div>
                  
                  <div class="flex items-center justify-between gap-3 p-3 rounded-[10px] border border-[color:var(--border)] surface-strong bg-[color:var(--surface)] col-span-2">
                    <span class="text-xs font-semibold text-[color:var(--text)]">Submit Button Colors</span>
                    <div class="flex gap-3">
                      <div class="flex items-center gap-1.5">
                        <span class="text-[10px] muted">Bg</span>
                        <input type="color" bind:value={colors.buttonBg} class="h-6 w-8 cursor-pointer rounded border border-[color:var(--border)] bg-transparent p-0" />
                      </div>
                      <div class="flex items-center gap-1.5">
                        <span class="text-[10px] muted">Text</span>
                        <input type="color" bind:value={colors.buttonText} class="h-6 w-8 cursor-pointer rounded border border-[color:var(--border)] bg-transparent p-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Typography styling options -->
              <div class="space-y-2 pt-1 border-t border-[color:var(--border-subtle)]">
                <span class="text-xs font-semibold uppercase tracking-wider muted">Typography & Fonts</span>
                <select
                  bind:value={fontUrl}
                  class="field cursor-pointer w-full text-xs"
                >
                  {#each googleFontsPresets as font}
                    <option value={font}>{font}</option>
                  {/each}
                </select>
              </div>

              <!-- Shapes & Border sizes -->
              <div class="space-y-4 pt-3 border-t border-[color:var(--border-subtle)]">
                <span class="text-xs font-semibold uppercase tracking-wider muted block">Shapes & Borders</span>
                
                <div class="space-y-3">
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs text-[color:var(--text)]">Card Corners</span>
                      <span class="text-xs font-bold text-[color:var(--accent)]">{borderRadius}px</span>
                    </div>
                    <input
                      type="range" min="0" max="48"
                      bind:value={borderRadius}
                      class="w-full accent-[color:var(--accent)] cursor-pointer h-1.5 bg-[color:var(--surface-muted)] border border-[color:var(--border)] rounded-lg appearance-none"
                    />
                  </div>

                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs text-[color:var(--text)]">Input Fields Corners</span>
                      <span class="text-xs font-bold text-[color:var(--accent)]">{inputRadius}px</span>
                    </div>
                    <input
                      type="range" min="0" max="32"
                      bind:value={inputRadius}
                      class="w-full accent-[color:var(--accent)] cursor-pointer h-1.5 bg-[color:var(--surface-muted)] border border-[color:var(--border)] rounded-lg appearance-none"
                    />
                  </div>
                </div>
              </div>

              <!-- Drag and Drop Floating Assets -->
              <div class="space-y-4 pt-3 border-t border-[color:var(--border-subtle)]">
                <span class="text-xs font-semibold uppercase tracking-wider muted block">Floating Decals (Stickers)</span>
                
                <div class="space-y-3">
                  <div class="space-y-2">
                    <input
                      type="text"
                      bind:value={newAssetName}
                      placeholder="Sticker Name (e.g. SRM Logo)..."
                      class="field w-full text-xs"
                    />
                    <div class="flex gap-2">
                      <input
                        type="text"
                        bind:value={newAssetUrl}
                        placeholder="Paste sticker/image URL..."
                        class="field flex-grow text-xs"
                      />
                      <button
                        type="button"
                        onclick={() => {
                          if (newAssetUrl.trim()) {
                            floatingAssets.push({
                              id: crypto.randomUUID(),
                              name: newAssetName.trim() || `Sticker ${floatingAssets.length + 1}`,
                              url: newAssetUrl.trim(),
                              x: 50,
                              y: 35,
                              width: newAssetWidth
                            });
                            newAssetName = "";
                            newAssetUrl = "";
                            notifications.add("Sticker added! Click & drag inside the live mockup to place.", "success");
                          }
                        }}
                        class="btn btn-secondary px-3 py-2 text-xs"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-[color:var(--text)]">Sticker Scale</span>
                    <div class="flex items-center gap-2">
                      <input
                        type="range" min="3" max="80"
                        bind:value={newAssetWidth}
                        class="accent-[color:var(--accent)] cursor-pointer h-1 w-20 bg-[color:var(--surface-muted)] border-0"
                      />
                      <span class="text-xs font-bold text-[color:var(--accent)]">{newAssetWidth}%</span>
                    </div>
                  </div>

                  {#if floatingAssets.length > 0}
                    <div class="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {#each floatingAssets as asset, index}
                        <div class="flex items-center justify-between gap-3 p-2 bg-[color:var(--surface-muted)] border rounded-[8px] text-[10px] font-semibold">
                          <div class="flex items-center gap-2 truncate">
                            <img src={asset.url} alt="decal thumb" class="w-6 h-6 object-contain rounded bg-white" />
                            <span class="truncate max-w-[120px]">{asset.name || 'Decal'}</span>
                          </div>
                          <div class="flex items-center gap-3">
                            <span class="text-slate-400 font-bold">{asset.x}%, {asset.y}%</span>
                            <button
                              type="button"
                              onclick={() => {
                                floatingAssets.push({
                                  id: crypto.randomUUID(),
                                  name: asset.name ? `${asset.name} (Copy)` : 'Sticker Copy',
                                  url: asset.url,
                                  x: Math.min(100, asset.x + 5),
                                  y: Math.min(100, asset.y + 5),
                                  width: asset.width
                                });
                                notifications.add("Sticker duplicated!", "success");
                              }}
                              class="text-slate-400 hover:text-[color:var(--accent)]"
                              title="Duplicate Sticker"
                            >
                              <i class="fas fa-copy"></i>
                            </button>
                            <button
                              type="button"
                              onclick={() => floatingAssets.splice(index, 1)}
                              class="text-slate-400 hover:text-[color:var(--danger)]"
                              title="Delete Sticker"
                            >
                              <i class="fas fa-trash-alt"></i>
                            </button>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Repeating Footer Image -->
              <div class="space-y-4 pt-3 border-t border-[color:var(--border-subtle)]">
                <span class="text-xs font-semibold uppercase tracking-wider muted block">Repeating Footer Image</span>
                <div class="space-y-2">
                  <input
                    type="text"
                    bind:value={colors.footerImageUrl}
                    placeholder="Paste footer image URL (e.g. street.png)..."
                    class="field w-full text-xs"
                  />
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-[color:var(--text)]">Footer Height</span>
                    <div class="flex items-center gap-2">
                      <input
                        type="range" min="20" max="200"
                        bind:value={colors.footerImageHeight}
                        class="accent-[color:var(--accent)] cursor-pointer h-1 w-20 bg-[color:var(--surface-muted)] border-0"
                      />
                      <span class="text-xs font-bold text-[color:var(--accent)]">{colors.footerImageHeight || 80}px</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {:else}
            <!-- Code Injection textareas -->
            <div class="space-y-4">
              <div>
                <span class="text-xs font-semibold uppercase tracking-wider muted mb-1 block">Custom HTML Header</span>
                <textarea
                  bind:value={customHtmlHeader}
                  placeholder="<header class='custom-banner'><h1>My Survey Banner</h1></header>"
                  rows="3"
                  class="field font-mono w-full text-xs"
                ></textarea>
              </div>

              <div>
                <span class="text-xs font-semibold uppercase tracking-wider muted mb-1 block">Custom HTML Footer</span>
                <textarea
                  bind:value={customHtmlFooter}
                  placeholder="<footer class='custom-footer'><p>© 2026 SRMIST Technical</p></footer>"
                  rows="3"
                  class="field font-mono w-full text-xs"
                ></textarea>
              </div>

              <div>
                <span class="text-xs font-semibold uppercase tracking-wider muted mb-1 block">Custom CSS Stylesheet</span>
                <textarea
                  bind:value={customCss}
                  placeholder={".custom-banner { padding: 20px; text-align: center; }"}
                  rows="4"
                  class="field font-mono w-full text-xs"
                ></textarea>
              </div>

              <div>
                <span class="text-xs font-semibold uppercase tracking-wider muted mb-1 block">Custom JavaScript (Scoped)</span>
                <textarea
                  bind:value={customJs}
                  placeholder="console.log('Premium theme script initialized successfully');"
                  rows="3"
                  class="field font-mono w-full text-xs"
                ></textarea>
              </div>
            </div>
          {/if}

          <!-- Theme Presets Saving Module -->
          <div class="border-t border-[color:var(--border-subtle)] pt-5 space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider muted">Save Theme Preset</span>
              {#if editingThemeId}
                <button
                  type="button"
                  onclick={() => {
                    editingThemeId = null;
                    themeName = themeName ? `${themeName} (Copy)` : "";
                    notifications.add("Switched to 'Create New Preset' mode", "info");
                  }}
                  class="text-[10px] font-bold text-[color:var(--accent)] hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                >
                  <i class="fas fa-plus text-[8px]"></i> Save as New Preset
                </button>
              {/if}
            </div>
            <div class="space-y-3">
              <input
                type="text"
                bind:value={themeName}
                placeholder="Theme Name (e.g. Minimalist Mint)"
                class="field w-full text-xs"
              />
              <input
                type="text"
                bind:value={themeDesc}
                placeholder="Description / notes (optional)"
                class="field w-full text-xs"
              />
              
              <button
                onclick={saveTheme}
                disabled={savingTheme}
                class="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                {#if savingTheme}
                  <i class="fas fa-spinner fa-spin text-xs"></i> Saving Theme…
                {:else if editingThemeId}
                  <i class="fas fa-sync text-xs"></i> Update Saved Theme
                {:else}
                  <i class="fas fa-save text-xs"></i> Save Theme Template
                {/if}
              </button>
            </div>
          </div>

        </Surface>
      </section>

      <!-- Beautiful Browser Device Mockup on the Right -->
      <section class="h-full flex flex-col">
        <Surface className="panel-section flex-1 flex flex-col p-0 overflow-hidden shadow-md">
          
          <!-- Realistic Web Browser Window Outline Controls -->
          <div class="bg-[color:var(--surface-muted)] border-b border-[color:var(--border)] px-5 py-3 flex items-center justify-between">
            <div class="flex items-center gap-4 min-w-0 flex-1">
              <!-- Location Search Bar with interactive question types switcher -->
              <div class="flex-grow max-w-xl h-8 rounded-[8px] bg-[color:var(--surface)] border border-[color:var(--border)] px-3 text-xs font-medium text-slate-500 flex items-center justify-between select-none">
                <div class="flex items-center gap-2 truncate">
                  <i class="fas fa-globe text-[11px] text-slate-400"></i>
                  <span class="truncate font-semibold hidden sm:inline text-slate-400">quill.forms/preview?type=</span>
                  <select
                    bind:value={currentSlide}
                    class="bg-transparent border-0 py-0.5 text-xs font-bold text-slate-600 focus:ring-0 cursor-pointer outline-none pl-0 pr-6"
                  >
                    <option value={0}>01. Text (Short Answer)</option>
                    <option value={1}>02. Long Text (Paragraph)</option>
                    <option value={2}>03. Number Input</option>
                    <option value={3}>04. Email Field</option>
                    <option value={4}>05. Phone Input</option>
                    <option value={5}>06. Date Selector</option>
                    <option value={6}>07. Multiple Choice</option>
                    <option value={7}>08. Checkboxes</option>
                    <option value={8}>09. Dropdown Select</option>
                    <option value={9}>10. Yes / No Toggle</option>
                    <option value={10}>11. Star Rating</option>
                    <option value={11}>12. Image Upload</option>
                  </select>
                </div>
                <div class="flex gap-2 text-[10px] text-slate-400 font-semibold select-none">
                  <span>{currentSlide + 1} / 12</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3 pl-4">
              <span class="badge-success status-badge text-[10px] px-2 py-0.5">LIVE MOCKUP</span>
              
              <!-- Desktop / Mobile Segmented Switcher -->
              <div class="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300">
                <button
                  type="button"
                  onclick={() => mockupMode = 'desktop'}
                  class="px-2.5 py-1 text-[10px] font-bold rounded-md flex items-center gap-1.5 transition-all {mockupMode === 'desktop' ? 'bg-white text-slate-800 shadow-sm font-extrabold' : 'text-slate-500 hover:text-slate-700'}"
                >
                  <i class="fas fa-desktop"></i> Desktop
                </button>
                <button
                  type="button"
                  onclick={() => mockupMode = 'mobile'}
                  class="px-2.5 py-1 text-[10px] font-bold rounded-md flex items-center gap-1.5 transition-all {mockupMode === 'mobile' ? 'bg-white text-slate-800 shadow-sm font-extrabold' : 'text-slate-500 hover:text-slate-700'}"
                >
                  <i class="fas fa-mobile-alt"></i> Mobile
                </button>
              </div>
            </div>
          </div>

          <!-- Viewport of Mockup Render (centered typeform-style presentation slide layout) -->
          <div class={mockupMode === 'mobile' ? 'flex-grow bg-slate-100 flex items-center justify-center p-8 overflow-y-auto' : 'flex-grow flex flex-col'} style={mockupMode === 'mobile' ? 'min-height: 580px;' : ''}>
            <div
              class={mockupMode === 'mobile' 
                ? 'relative w-[375px] h-[720px] min-h-[720px] rounded-[48px] border-[14px] border-slate-900 shadow-2xl flex flex-col overflow-hidden bg-white' 
                : 'contents'}
              style={mockupMode === 'mobile' ? 'border-color: #0f172a; box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.4);' : ''}
            >
              {#if mockupMode === 'mobile'}
                <!-- Dynamic Island / Notched Island camera -->
                <div class="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-900 rounded-full z-40 flex items-center justify-end px-4 gap-1.5 pointer-events-none">
                  <span class="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                  <span class="w-2.5 h-2.5 rounded-full bg-indigo-950/80 border border-slate-800"></span>
                </div>
              {/if}

              <div
                bind:this={viewportElement}
                class="mock-viewport flex-grow p-10 flex flex-col justify-between transition-all duration-300 relative select-none overflow-hidden {mockupMode === 'mobile' ? 'w-full h-full max-h-[720px] min-h-[720px] p-6' : 'min-h-[580px]'}"
                style="--sticker-scale-base: {mockupMode === 'mobile' ? '4.5px' : '8px'};"
              >
            
            <!-- Dynamic progress bar tracking slide completion -->
            <div class="absolute top-0 left-0 w-full h-1 bg-[color:var(--border-subtle)]">
              <div class="h-full transition-all duration-300" style="width: {((currentSlide + 1) / 12) * 100}%; background-color: {colors.accent || colors.primary};"></div>
            </div>

            <!-- Repeating Footer Background Image -->
            {#if colors.footerImageUrl}
              <div
                class="absolute bottom-0 left-0 right-0 pointer-events-none select-none z-0"
                style="background-image: url('{colors.footerImageUrl}'); background-repeat: repeat-x; background-position: bottom; background-size: auto 100%; height: {colors.footerImageHeight || 80}px;"
              ></div>
            {/if}

            <!-- Draggable Floating Assets rendered inside the mockup! -->
            {#each floatingAssets as asset, index}
              {@const currentX = mockupMode === 'mobile' ? (asset.mobileX !== undefined ? asset.mobileX : asset.x) : asset.x}
              {@const currentY = mockupMode === 'mobile' ? (asset.mobileY !== undefined ? asset.mobileY : asset.y) : asset.y}
              {@const currentW = mockupMode === 'mobile' ? (asset.mobileWidth !== undefined ? asset.mobileWidth : asset.width) : asset.width}
              <div
                role="button"
                tabindex="0"
                class="absolute z-20 cursor-move border-2 border-transparent hover:border-dashed hover:border-[color:var(--accent)] group"
                style="left: {currentX}%; top: {currentY}%; width: {typeof currentW === 'number' && currentW <= 100 ? `calc(${currentW} * var(--sticker-scale-base, 8px))` : currentW}; transform: translate(-50%, -50%);"
                onmousedown={(e) => startAssetDrag(index, e)}
              >
                <img
                  src={asset.url}
                  alt="decal"
                  class="w-full h-auto object-contain pointer-events-none select-none"
                />
                
                <!-- MS Paint/Canva Style Corner Resize Handle -->
                <div
                  role="button"
                  tabindex="0"
                  class="absolute bottom-0 right-0 w-3 h-3 bg-[color:var(--accent)] border-2 border-white rounded-full cursor-se-resize z-30 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 translate-y-1 shadow"
                  onmousedown={(e) => startAssetResize(index, e)}
                ></div>
                <div class="absolute -top-5 left-1/2 -translate-x-1/2 bg-[color:var(--accent)] text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase select-none pointer-events-none whitespace-nowrap">
                  {asset.name || 'Drag Decal'}
                </div>
              </div>
            {/each}

            <!-- Injected custom HTML header block -->
            {#if customHtmlHeader}
              <div class="w-full mb-6 relative z-10">
                {@html customHtmlHeader}
              </div>
            {/if}

            <!-- Center container with slide content -->
            <div class="flex-grow flex items-center justify-center py-10 relative z-10">
              <div class="max-w-xl w-full text-left space-y-6">
                
                {#if currentSlide === 0}
                  <!-- Slide 1: Text Field -->
                  <div class="space-y-6">
                    <h3 class="text-3xl md:text-4xl font-normal leading-tight tracking-tight flex items-start gap-1">
                      <span>What is your full name?</span>
                      <span class="text-red-500 text-sm font-bold">*</span>
                    </h3>
                    <div class="relative max-w-md mt-6">
                      <input
                        type="text"
                        placeholder="Type your answer here..."
                        value="Pradeepto Pal"
                        readonly
                        class="w-full bg-transparent border-b-2 py-3 text-lg md:text-xl font-normal outline-none transition-all"
                        style="border-color: {colors.accent || colors.primary}33; color: {colors.text};"
                      />
                    </div>
                    <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>⌨️ Press Enter or Down Arrow to continue • Up Arrow to go back</span>
                    </div>
                  </div>

                {:else if currentSlide === 1}
                  <!-- Slide 2: Long Text Field -->
                  <div class="space-y-6">
                    <h3 class="text-3xl md:text-4xl font-normal leading-tight tracking-tight flex items-start gap-1">
                      <span>Tell us about your background & motivation.</span>
                      <span class="text-red-500 text-sm font-bold">*</span>
                    </h3>
                    <div class="relative max-w-md mt-6">
                      <textarea
                        placeholder="Type your paragraph answer here..."
                        readonly
                        rows="3"
                        class="w-full bg-transparent border-b-2 py-2 text-lg md:text-xl font-normal outline-none transition-all resize-none"
                        style="border-color: {colors.accent || colors.primary}33; color: {colors.text};"
                      >I am highly passionate about coding, UX design, and event registration scaling...</textarea>
                    </div>
                    <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>⌨️ Press Enter + Shift for new line • Enter to continue</span>
                    </div>
                  </div>

                {:else if currentSlide === 2}
                  <!-- Slide 3: Number Field -->
                  <div class="space-y-6">
                    <h3 class="text-3xl md:text-4xl font-normal leading-tight tracking-tight flex items-start gap-1">
                      <span>How old are you?</span>
                      <span class="text-red-500 text-sm font-bold">*</span>
                    </h3>
                    <div class="relative max-w-md mt-6">
                      <input
                        type="number"
                        placeholder="Enter age..."
                        value="21"
                        readonly
                        class="w-40 bg-transparent border-b-2 py-3 text-lg md:text-xl font-normal outline-none transition-all"
                        style="border-color: {colors.accent || colors.primary}33; color: {colors.text};"
                      />
                    </div>
                    <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>⌨️ Enter a numeric digit value to continue</span>
                    </div>
                  </div>

                {:else if currentSlide === 3}
                  <!-- Slide 4: Email Field -->
                  <div class="space-y-6">
                    <h3 class="text-3xl md:text-4xl font-normal leading-tight tracking-tight flex items-start gap-1">
                      <span>What is your email address?</span>
                      <span class="text-red-500 text-sm font-bold">*</span>
                    </h3>
                    <div class="relative max-w-md mt-6 flex items-center gap-3 border-b-2 pb-3" style="border-color: {colors.accent || colors.primary}33;">
                      <i class="fas fa-envelope text-slate-400 text-lg"></i>
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value="pradeepto@geekroom.in"
                        readonly
                        class="flex-grow bg-transparent text-lg md:text-xl font-normal outline-none"
                        style="color: {colors.text};"
                      />
                    </div>
                    <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>⌨️ Enter a valid email structure to continue</span>
                    </div>
                  </div>

                {:else if currentSlide === 4}
                  <!-- Slide 5: Phone Field -->
                  <div class="space-y-6">
                    <h3 class="text-3xl md:text-4xl font-normal leading-tight tracking-tight flex items-start gap-1">
                      <span>What is your phone number?</span>
                      <span class="text-red-500 text-sm font-bold">*</span>
                    </h3>
                    <div class="flex items-center gap-3 max-w-md mt-6 border-b-2 pb-3" style="border-color: {colors.accent || colors.primary}33;">
                      <span class="text-xs text-slate-400 flex items-center gap-1 font-semibold select-none">
                        <i class="fas fa-globe"></i> Select
                      </span>
                      <input
                        type="text"
                        placeholder="Enter your phone number..."
                        value="+91 98765 43210"
                        readonly
                        class="flex-grow bg-transparent py-1 text-lg md:text-xl font-normal outline-none transition-all"
                        style="color: {colors.text};"
                      />
                    </div>
                    <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>⌨️ Enter valid contact information to continue</span>
                    </div>
                  </div>

                {:else if currentSlide === 5}
                  <!-- Slide 6: Date Field -->
                  <div class="space-y-6">
                    <h3 class="text-3xl md:text-4xl font-normal leading-tight tracking-tight flex items-start gap-1">
                      <span>When is your date of birth?</span>
                      <span class="text-red-500 text-sm font-bold">*</span>
                    </h3>
                    <div class="relative max-w-md mt-6 flex items-center gap-3 border-b-2 pb-3" style="border-color: {colors.accent || colors.primary}33;">
                      <i class="fas fa-calendar-alt text-slate-400 text-lg"></i>
                      <input
                        type="text"
                        value="May 31, 2005"
                        readonly
                        class="flex-grow bg-transparent text-lg md:text-xl font-normal outline-none"
                        style="color: {colors.text};"
                      />
                    </div>
                    <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>⌨️ Input date format to continue</span>
                    </div>
                  </div>

                {:else if currentSlide === 6}
                  <!-- Slide 7: Multiple Choice -->
                  <div class="space-y-6">
                    <h3 class="text-3xl md:text-4xl font-normal leading-tight tracking-tight flex items-start gap-1">
                      <span>Which track are you participating in?</span>
                      <span class="text-red-500 text-sm font-bold">*</span>
                    </h3>
                    
                    <div class="space-y-3 max-w-md mt-6">
                      <div class="mock-card border px-4 py-3 text-xs flex items-center justify-between transition-all font-semibold shadow-sm">
                        <div class="flex items-center gap-3">
                          <span class="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-extrabold" style="border-color: {colors.accent || colors.primary}; color: {colors.accent || colors.primary};">A</span>
                          <span>Web & Mobile Development</span>
                        </div>
                      </div>

                      <div class="mock-card border px-4 py-3 text-xs flex items-center justify-between transition-all font-semibold shadow-sm" style="border-color: {colors.accent || colors.primary}; bg-color: {colors.cardBg};">
                        <div class="flex items-center gap-3">
                          <span class="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-extrabold bg-[color:var(--accent-soft)]" style="border-color: {colors.accent || colors.primary}; color: {colors.accent || colors.primary};">B</span>
                          <span>AI / Machine Learning</span>
                        </div>
                        <i class="fas fa-check-circle opacity-100 animate-pulse" style="color: {colors.accent || colors.primary};"></i>
                      </div>

                      <div class="mock-card border px-4 py-3 text-xs flex items-center justify-between transition-all font-semibold shadow-sm">
                        <div class="flex items-center gap-3">
                          <span class="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-extrabold" style="border-color: {colors.accent || colors.primary}; color: {colors.accent || colors.primary};">C</span>
                          <span>Game Development</span>
                        </div>
                      </div>
                    </div>
                    <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>⌨️ Select one track to continue</span>
                    </div>
                  </div>

                {:else if currentSlide === 7}
                  <!-- Slide 8: Checkboxes -->
                  <div class="space-y-6">
                    <h3 class="text-3xl md:text-4xl font-normal leading-tight tracking-tight flex items-start gap-1">
                      <span>What programming languages do you know?</span>
                      <span class="text-slate-400 text-xs font-semibold">(Select all that apply)</span>
                    </h3>
                    
                    <div class="space-y-3 max-w-md mt-6">
                      <div class="mock-card border px-4 py-3 text-xs flex items-center justify-between transition-all font-semibold shadow-sm" style="border-color: {colors.accent || colors.primary};">
                        <div class="flex items-center gap-3">
                          <span class="w-5 h-5 rounded border flex items-center justify-center text-[9px] bg-[color:var(--accent-soft)]" style="border-color: {colors.accent || colors.primary}; color: {colors.accent || colors.primary};"><i class="fas fa-check"></i></span>
                          <span>TypeScript / JavaScript</span>
                        </div>
                      </div>

                      <div class="mock-card border px-4 py-3 text-xs flex items-center justify-between transition-all font-semibold shadow-sm">
                        <div class="flex items-center gap-3">
                          <span class="w-5 h-5 rounded border flex items-center justify-center text-[9px] border-slate-300"></span>
                          <span>Python</span>
                        </div>
                      </div>

                      <div class="mock-card border px-4 py-3 text-xs flex items-center justify-between transition-all font-semibold shadow-sm" style="border-color: {colors.accent || colors.primary};">
                        <div class="flex items-center gap-3">
                          <span class="w-5 h-5 rounded border flex items-center justify-center text-[9px] bg-[color:var(--accent-soft)]" style="border-color: {colors.accent || colors.primary}; color: {colors.accent || colors.primary};"><i class="fas fa-check"></i></span>
                          <span>Rust / Go</span>
                        </div>
                      </div>
                    </div>
                    <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>⌨️ Click checkboxes or keyboard shortcuts to select multiple</span>
                    </div>
                  </div>

                {:else if currentSlide === 8}
                  <!-- Slide 9: Dropdown Select -->
                  <div class="space-y-6">
                    <h3 class="text-3xl md:text-4xl font-normal leading-tight tracking-tight flex items-start gap-1">
                      <span>Select your country of residence.</span>
                      <span class="text-red-500 text-sm font-bold">*</span>
                    </h3>
                    <div class="relative max-w-md mt-6">
                      <div class="mock-input border px-4 py-3 flex items-center justify-between text-xs font-semibold cursor-pointer shadow-sm">
                        <span class="font-medium">India</span>
                        <i class="fas fa-chevron-down text-slate-400"></i>
                      </div>
                    </div>
                    <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>⌨️ Press Enter to trigger country dropdown options</span>
                    </div>
                  </div>

                {:else if currentSlide === 9}
                  <!-- Slide 10: Yes/No Toggle -->
                  <div class="space-y-6">
                    <h3 class="text-3xl md:text-4xl font-normal leading-tight tracking-tight flex items-start gap-1">
                      <span>Do you agree to SRMIST Code of Conduct?</span>
                      <span class="text-red-500 text-sm font-bold">*</span>
                    </h3>
                    <div class="flex gap-4 max-w-md mt-6">
                      <div class="mock-card border flex-1 py-4 flex flex-col items-center justify-center gap-2 cursor-pointer font-bold transition-all shadow-sm" style="border-color: {colors.accent || colors.primary};">
                        <span class="text-lg font-extrabold" style="color: {colors.accent || colors.primary};">Y</span>
                        <span class="text-xs">Yes, I agree</span>
                      </div>
                      <div class="mock-card border flex-1 py-4 flex flex-col items-center justify-center gap-2 cursor-pointer font-bold opacity-60 transition-all shadow-sm">
                        <span class="text-lg">N</span>
                        <span class="text-xs">No, I decline</span>
                      </div>
                    </div>
                    <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>⌨️ Click choice capsule or press Y / N</span>
                    </div>
                  </div>

                {:else if currentSlide === 10}
                  <!-- Slide 11: Star Rating -->
                  <div class="space-y-6">
                    <h3 class="text-3xl md:text-4xl font-normal leading-tight tracking-tight flex items-start gap-1">
                      <span>Rate your experience with our platform!</span>
                      <span class="text-red-500 text-sm font-bold">*</span>
                    </h3>
                    <div class="flex items-center gap-3 mt-6">
                      {#each [1, 2, 3, 4] as star}
                        <i class="fas fa-star text-2xl cursor-pointer" style="color: {colors.accent || colors.primary};"></i>
                      {/each}
                      <i class="far fa-star text-2xl text-slate-300 cursor-pointer"></i>
                    </div>
                    <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>⌨️ Press numbers 1-5 to quickly assign star ratings</span>
                    </div>
                  </div>

                {:else if currentSlide === 11}
                  <!-- Slide 12: Image Upload -->
                  <div class="space-y-6">
                    <h3 class="text-3xl md:text-4xl font-normal leading-tight tracking-tight flex items-start gap-1">
                      <span>Upload your resume or identification.</span>
                      <span class="text-slate-400 text-xs font-semibold">(Max file size: 5MB)</span>
                    </h3>
                    
                    <div class="mock-card border border-dashed p-8 flex flex-col items-center justify-center text-center max-w-md mt-6 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                      <div class="w-12 h-12 rounded-full flex items-center justify-center bg-[color:var(--accent-soft)] mb-3" style="color: {colors.accent || colors.primary};">
                        <i class="fas fa-cloud-upload-alt text-lg"></i>
                      </div>
                      <span class="text-xs font-bold mb-1">Drag and drop file here</span>
                      <span class="text-[10px] text-slate-400">Supports PDF, DOCX, JPEG or PNG</span>
                    </div>
                    <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>⌨️ Select local files to attach and validate constraints</span>
                    </div>
                  </div>
                {/if}

              </div>
            </div>

            <!-- Injected custom HTML footer block -->
            {#if customHtmlFooter}
              <div class="w-full mt-6 relative z-10">
                {@html customHtmlFooter}
              </div>
            {/if}

            <!-- Presentation navigation floor footer bar matching typeform layout -->
            {#if mockupMode === 'mobile'}
              <!-- Beautiful Mobile Navigation Drawer Mockup inside the phone! -->
              <div
                class="w-full border-t pt-3 flex items-center gap-3 mt-6 relative z-10 safe-area-pb"
                style="border-color: {colors.cardBorder}55; background: color-mix(in srgb, {colors.cardBg} 92%, transparent); backdrop-filter: blur(14px);"
              >
                <button
                  onclick={() => currentSlide = Math.max(0, currentSlide - 1)}
                  disabled={currentSlide === 0}
                  class="mock-btn h-11 w-11 shrink-0 rounded-full border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-95"
                  style="background: rgba(0, 0, 0, 0.04); border-color: {colors.cardBorder}aa; color: {colors.text};"
                >
                  <i class="fas fa-arrow-left"></i>
                </button>

                <div class="min-w-0 flex-1">
                  <div class="mb-1 flex items-center justify-between gap-3 text-[9px] font-semibold uppercase tracking-wider" style="color: {colors.text}88;">
                    <span>Question {currentSlide + 1} of 12</span>
                    <span>{Math.round(((currentSlide + 1) / 12) * 100)}%</span>
                  </div>
                  <div class="h-1.5 overflow-hidden rounded-full" style="background: rgba(0, 0, 0, 0.08);">
                    <div
                      class="h-full rounded-full transition-all duration-300"
                      style="width: {((currentSlide + 1) / 12) * 100}%; background: {colors.accent || colors.primary};"
                    ></div>
                  </div>
                </div>

                <button
                  onclick={() => currentSlide = (currentSlide + 1) % 12}
                  class="mock-btn h-12 min-w-[110px] rounded-full px-4 font-semibold text-xs shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                  style="background: {colors.buttonBg || colors.primary}; color: {colors.buttonText || '#ffffff'};"
                >
                  {#if currentSlide === 11}
                    Restart <i class="fas fa-redo text-[9px]"></i>
                  {:else}
                    Continue <i class="fas fa-arrow-right text-[9px]"></i>
                  {/if}
                </button>
              </div>
            {:else}
              <!-- Desktop Navigation Footer -->
              <div class="w-full border-t pt-4 flex items-center justify-between text-xs mt-6 relative z-10" style="border-color: {colors.cardBorder}55;">
                <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider select-none">
                  This form is in beta. Report errors to Pradeepto Pal
                </div>

                <!-- Navigation arrow keypads and responsive Solid/Custom Color Next button -->
                <div class="flex items-center gap-3">
                  <div class="flex border rounded-[8px] overflow-hidden" style="border-color: {colors.cardBorder}aa; background-color: {colors.cardBg};">
                    <button
                      onclick={() => currentSlide = Math.max(0, currentSlide - 1)}
                      disabled={currentSlide === 0}
                      class="p-2 border-r hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                      style="border-color: {colors.cardBorder}aa;"
                    >
                      <i class="fas fa-chevron-up text-[10px]"></i>
                    </button>
                    <button
                      onclick={() => currentSlide = Math.min(11, currentSlide + 1)}
                      disabled={currentSlide === 11}
                      class="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                    >
                      <i class="fas fa-chevron-down text-[10px]"></i>
                    </button>
                  </div>

                  <button
                    onclick={() => currentSlide = (currentSlide + 1) % 12}
                    class="mock-btn px-4 py-2 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
                  >
                    {#if currentSlide === 11}
                      Restart <i class="fas fa-redo text-[10px]"></i>
                    {:else}
                      NEXT <i class="fas fa-arrow-right text-[10px]"></i>
                    {/if}
                  </button>
                </div>
              </div>
            {/if}

            </div>
          </div>
        </div>

        </Surface>
      </section>

    </div>

    <!-- Themes Catalog Bottom Section -->
    <div class="mt-8 border-t border-[color:var(--border)] pt-8 space-y-5">
      <div>
        <h2 class="text-xl font-bold tracking-tight text-[color:var(--text)] flex items-center gap-2">
          <i class="fas fa-folder-open text-[color:var(--accent)] text-lg"></i>
          My Custom Themes
        </h2>
        <p class="text-sm muted">Manage or select from your previous custom theme presets</p>
      </div>

      {#if loadingThemes}
        <div class="flex flex-col items-center justify-center py-16 gap-3">
          <div class="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--border)] border-t-[color:var(--accent)]"></div>
          <p class="text-xs muted">Fetching your custom templates…</p>
        </div>
      {:else if customThemes.length === 0}
        <Surface className="panel-section text-center py-12">
          <i class="fas fa-magic text-3xl text-slate-300 dark:text-gray-600 mb-2"></i>
          <h4 class="text-sm font-semibold text-[color:var(--text)]">No Custom Themes Yet</h4>
          <p class="text-xs muted mt-1">Design a theme above and click save to save it as a reusable preset template.</p>
        </Surface>
      {:else}
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {#each customThemes as theme (theme.id)}
            <Surface
              className="p-5 hover:border-[color:var(--accent)] transition-all cursor-pointer flex flex-col gap-3 group relative text-left"
            >
              <div
                role="button"
                tabindex="0"
                onclick={() => applyExistingTheme(theme)}
                onkeydown={(e) => e.key === 'Enter' && applyExistingTheme(theme)}
                class="flex flex-col h-full justify-between"
              >
                <div>
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <h4 class="font-bold text-base text-[color:var(--text)] truncate">{theme.name}</h4>
                    <button
                      onclick={(e) => deleteTheme(theme.id, e)}
                      class="text-slate-400 hover:text-[color:var(--danger)] p-1 rounded transition-colors"
                      title="Delete Theme Preset"
                      aria-label="Delete Theme Preset"
                    >
                      <i class="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>

                  {#if theme.description}
                    <p class="text-xs muted mb-3 line-clamp-2">{theme.description}</p>
                  {/if}

                  <!-- Visual swatches and badges -->
                  <div class="flex flex-wrap gap-1.5 mb-4">
                    {#if theme.custom_css}
                      <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">CSS</span>
                    {/if}
                    {#if theme.custom_js}
                      <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">JS</span>
                    {/if}
                    {#if theme.custom_html_header || theme.custom_html_footer}
                      <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">HTML</span>
                    {/if}
                  </div>
                </div>

                {#if theme.colors}
                  <div class="flex gap-1.5 items-center mt-auto">
                    {#each Object.entries(theme.colors).slice(0, 5) as [colorName, colorValue]}
                      {#if colorValue && colorName !== "floatingAssets"}
                        <div
                          class="w-5 h-5 rounded-full border border-[color:var(--border)] shadow-sm"
                          style="background-color: {colorValue}"
                          title={colorName}
                        ></div>
                      {/if}
                    {/each}
                  </div>
                {/if}
              </div>
            </Surface>
          {/each}
        </div>
      {/if}
    </div>

  </main>
</div>

<style>
  /* Custom slider handle thumb customizations */
  input[type="range"]::-webkit-slider-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
  }
</style>
