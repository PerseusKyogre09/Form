<script lang="ts">
  import type { Theme, ThemeDecoration } from "$lib/types";
  import type { ThemeSceneMetrics, ThemeViewportMode } from "$lib/utils/themeLayout";
  import {
    createThemeSceneMetrics,
    normalizeThemeScene,
  } from "$lib/utils/themeLayout";

  export let theme: Theme | undefined;
  export let backgroundType: "color" | "image" = "color";
  export let backgroundImage = "";
  export let mockupMode: ThemeViewportMode = "desktop";
  export let viewportStyle = "";
  export let layoutMetrics: ThemeSceneMetrics | null = null;
  export let viewportWidth = 1440;
  export let viewportHeight = 900;

  $: scene = normalizeThemeScene(theme);
  $: metrics =
    layoutMetrics ??
    createThemeSceneMetrics({
      width: viewportWidth,
      height: viewportHeight,
      mode: mockupMode,
      footerHeight: scene.footer.height,
    });

  // Scene Grouping Logic
  function getSceneGroup(decoration: ThemeDecoration): "street" | "content" | "background" | "foreground" {
    if (decoration.anchor === "footer" || decoration.zone === "footer") {
      return "street";
    }
    if (
      decoration.anchor === "question-area" ||
      decoration.anchor === "content" ||
      decoration.zone === "content"
    ) {
      return "content";
    }
    if (decoration.zone === "header" || decoration.anchor === "header") {
      return "background";
    }
    return "foreground";
  }

  // Normalized responsive coordinate rendering pipeline
  function getNormalizedStyle(
    asset: ThemeDecoration,
    metrics: ThemeSceneMetrics,
    mode: ThemeViewportMode,
    sceneType: "street" | "content" | "background" | "foreground"
  ): string {
    const isMobile = mode === "mobile";

    // Establish design baselines for clean percentage/normalized conversion
    let refWidth = isMobile ? 390 : 860;
    let refHeight = isMobile ? 844 : 860;

    if (sceneType === "street") {
      refHeight = metrics.zones.footer.height || 80;
    } else if (sceneType === "content") {
      refWidth = isMobile ? 358 : 768;
      refHeight = metrics.anchors["question-area"]?.height || 360;
    }

    const widthRef = refWidth || 860;
    const heightRef = refHeight || 80;

    const alignX = asset.alignX ?? "center";
    const alignY = asset.alignY ?? "middle";

    const widthVal = isMobile ? asset.mobileWidth ?? asset.width : asset.width;
    const heightVal = isMobile ? asset.mobileHeight ?? asset.height : asset.height;

    // Resolve width using the design canvas references to avoid scaling based on monitor resolution
    let w = "auto";
    if (typeof widthVal === "number") {
      if (widthVal <= 100) {
        w = `${Math.max(widthRef * (widthVal / 100), 24)}px`;
      } else {
        w = `${widthVal}px`;
      }
    } else {
      w = isMobile ? "65px" : "144px";
    }

    // Resolve height
    let h = "auto";
    if (typeof heightVal === "number") {
      h = `${heightVal}px`;
    }

    // Resolve raw offsets
    const rawOffsetX = isMobile ? asset.mobileOffsetX ?? asset.offsetX ?? 0 : asset.offsetX ?? 0;
    const rawOffsetY = isMobile ? asset.mobileOffsetY ?? asset.offsetY ?? 0 : asset.offsetY ?? 0;

    // Calculate normalized percentage positioning relative to scene groups
    let pctX = 50;
    let translateX = "-50%";
    if (alignX === "left") {
      pctX = (rawOffsetX / widthRef) * 100;
      translateX = "0%";
    } else if (alignX === "right") {
      pctX = 100 + (rawOffsetX / widthRef) * 100;
      translateX = "-100%";
    } else {
      pctX = 50 + (rawOffsetX / widthRef) * 100;
      translateX = "-50%";
    }

    let pctY = 50;
    let translateY = "-50%";
    if (alignY === "top") {
      pctY = (rawOffsetY / heightRef) * 100;
      translateY = "0%";
    } else if (alignY === "bottom") {
      pctY = 100 + (rawOffsetY / heightRef) * 100;
      translateY = "-100%";
    } else {
      pctY = 50 + (rawOffsetY / heightRef) * 100;
      translateY = "-50%";
    }

    const scale = isMobile ? asset.mobileScale ?? asset.scale ?? 1 : asset.scale ?? 1;
    const opacity = asset.opacity ?? 1;
    const rotate = asset.rotate ?? 0;

    const transform = `translate(${translateX}, ${translateY}) scale(${scale}) rotate(${rotate}deg)`;

    return `position: absolute; left: ${pctX}%; top: ${pctY}%; width: ${w}; height: ${h}; opacity: ${opacity}; transform: ${transform}; transform-origin: center bottom;`;
  }

  // Filter decorations into their respective scene group layers
  $: streetDecorations = scene.decorations.filter((d) => getSceneGroup(d) === "street");
  $: contentDecorations = scene.decorations.filter((d) => getSceneGroup(d) === "content");
  $: backgroundDecorations = scene.decorations.filter((d) => getSceneGroup(d) === "background");
  $: foregroundDecorations = scene.decorations.filter((d) => getSceneGroup(d) === "foreground");
</script>

<div class="absolute inset-0 overflow-hidden pointer-events-none" style={viewportStyle}>
  <!-- BACKGROUND SCENE (z-0) -->
  <div class="scene-group scene-background absolute inset-0 z-0 overflow-hidden">
    {#if backgroundType === "image" && backgroundImage}
      <div
        class="absolute inset-0"
        style="background-image: url('{backgroundImage}'); background-size: cover; background-position: center; background-repeat: no-repeat;"
      ></div>
    {/if}

    {#each backgroundDecorations as asset (asset.id)}
      <div class="absolute select-none" style={getNormalizedStyle(asset, metrics, mockupMode, "background")}>
        <img
          src={asset.url}
          alt={asset.name || "Background decoration"}
          class="w-full object-contain"
          style="height: auto;"
        />
      </div>
    {/each}
  </div>

  <!-- STREET SCENE (z-10: Pavement ground & footer-attached decorations) -->
  <div
    class="scene-group scene-street absolute left-0 right-0 z-10"
    style={`top: ${metrics.zones.footer.top}px; height: ${metrics.zones.footer.height || 80}px;`}
  >
    {#if scene.footer.imageUrl}
      <div
        class="absolute inset-0 z-0"
        style={`background-image: url('${scene.footer.imageUrl}'); background-repeat: repeat-x; background-position: left bottom; background-size: auto 100%;`}
      ></div>
    {/if}

    {#each streetDecorations as asset (asset.id)}
      <div class="absolute select-none z-10" style={getNormalizedStyle(asset, metrics, mockupMode, "street")}>
        <img
          src={asset.url}
          alt={asset.name || "Street decoration"}
          class="w-full object-contain"
          style="height: auto;"
        />
      </div>
    {/each}
  </div>

  <!-- CONTENT SCENE (z-15: Anchored relative to the central questions card) -->
  <div
    class="scene-group scene-content absolute z-15 pointer-events-none"
    style={`top: ${metrics.anchors["question-area"]?.top || metrics.zones.content.top}px; left: ${metrics.anchors["question-area"]?.left || metrics.zones.content.left}px; width: ${metrics.anchors["question-area"]?.width || metrics.zones.content.width}px; height: ${metrics.anchors["question-area"]?.height || metrics.zones.content.height}px;`}
  >
    {#each contentDecorations as asset (asset.id)}
      <div class="absolute select-none z-10" style={getNormalizedStyle(asset, metrics, mockupMode, "content")}>
        <img
          src={asset.url}
          alt={asset.name || "Content decoration"}
          class="w-full object-contain"
          style="height: auto;"
        />
      </div>
    {/each}
  </div>

  <!-- FOREGROUND SCENE (z-20: General overlay decorations) -->
  <div class="scene-group scene-foreground absolute inset-0 z-20 overflow-hidden">
    {#each foregroundDecorations as asset (asset.id)}
      <div class="absolute select-none" style={getNormalizedStyle(asset, metrics, mockupMode, "foreground")}>
        <img
          src={asset.url}
          alt={asset.name || "Foreground decoration"}
          class="w-full object-contain"
          style="height: auto;"
        />
      </div>
    {/each}
  </div>
</div>
