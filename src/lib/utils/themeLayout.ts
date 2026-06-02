import type {
  Theme,
  ThemeAnchor,
  ThemeDecoration,
  ThemeFooterConfig,
  ThemeLayoutConfig,
  ThemeZone,
} from "$lib/types";

export type ThemeViewportMode = "desktop" | "mobile";

export interface ThemeRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface ThemeSceneMetrics {
  width: number;
  height: number;
  safeArea: { top: number; right: number; bottom: number; left: number };
  zones: Record<ThemeZone, ThemeRect>;
  anchors: Record<ThemeAnchor, ThemeRect>;
}

export interface NormalizedThemeScene {
  decorations: ThemeDecoration[];
  footer: ThemeFooterConfig;
}

const DEFAULT_FOOTER_HEIGHT = 88;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function inferZoneFromLegacyY(y = 50, stickyToFooter?: boolean): ThemeZone {
  if (stickyToFooter || y >= 74) return "footer";
  if (y <= 18) return "header";
  if (y >= 58) return "decoration";
  return "content";
}

function inferAnchor(zone: ThemeZone): ThemeAnchor {
  switch (zone) {
    case "header":
      return "header";
    case "content":
      return "question-area";
    case "footer":
      return "footer";
    case "navigation":
      return "bottom-navigation";
    default:
      return "safe-area";
  }
}

function inferAlignX(x = 50): "left" | "center" | "right" {
  if (x <= 33) return "left";
  if (x >= 67) return "right";
  return "center";
}

function inferAlignY(y = 50): "top" | "middle" | "bottom" {
  if (y <= 33) return "top";
  if (y >= 67) return "bottom";
  return "middle";
}

function baselinePercentForAlignX(alignX: "left" | "center" | "right") {
  if (alignX === "left") return 16;
  if (alignX === "right") return 84;
  return 50;
}

function baselinePercentForAlignY(alignY: "top" | "middle" | "bottom") {
  if (alignY === "top") return 16;
  if (alignY === "bottom") return 84;
  return 50;
}

export function toRawImageUrl(url: string | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  const githubRegex = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/([^/]+)\/(.+)$/;
  const match = trimmed.match(githubRegex);
  if (match) {
    const [, owner, repo, branch, path] = match;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  }
  return trimmed;
}

function legacyPercentToOffset(
  value: number | undefined,
  baselinePercent: number,
  sceneLength: number,
) {
  if (typeof value !== "number") return 0;
  return Math.round(((value - baselinePercent) / 100) * sceneLength);
}

export function normalizeThemeScene(theme?: Theme): NormalizedThemeScene {
  const colors = theme?.colors;
  const layout =
    theme?.layout ??
    colors?.layout ??
    ({
      version: 2,
      decorations: [],
      footer: {
        imageUrl: colors?.footerImageUrl,
        height: colors?.footerImageHeight,
      },
    } satisfies ThemeLayoutConfig);

  const decorations =
    layout.decorations && layout.decorations.length > 0
      ? layout.decorations.map((dec) => ({
          ...dec,
          url: toRawImageUrl(dec.url),
        }))
      : (colors?.floatingAssets || []).map((asset, index) => {
          const zone = inferZoneFromLegacyY(asset.y, asset.stickyToFooter);
          const alignX = inferAlignX(asset.x);
          const alignY =
            zone === "footer" ? "bottom" : inferAlignY(asset.y);

          return {
            id: asset.id || `legacy-decoration-${index}`,
            name: asset.name || `Decoration ${index + 1}`,
            url: toRawImageUrl(asset.url),
            zone,
            anchor: inferAnchor(zone),
            alignX,
            alignY,
            width: asset.width ?? 18,
            height: asset.height,
            opacity: asset.opacity ?? 1,
            rotate: asset.rotate ?? 0,
            offsetX: legacyPercentToOffset(asset.x, baselinePercentForAlignX(alignX), 1280),
            offsetY:
              zone === "footer"
                ? -Math.abs(legacyPercentToOffset(asset.y, 84, 720))
                : legacyPercentToOffset(asset.y, baselinePercentForAlignY(alignY), 720),
            mobileOffsetX: legacyPercentToOffset(
              asset.mobileX ?? asset.x,
              baselinePercentForAlignX(alignX),
              390,
            ),
            mobileOffsetY:
              zone === "footer"
                ? -Math.abs(legacyPercentToOffset(asset.mobileY ?? asset.y, 84, 844))
                : legacyPercentToOffset(
                    asset.mobileY ?? asset.y,
                    baselinePercentForAlignY(alignY),
                    844,
                  ),
            mobileWidth: asset.mobileWidth,
            mobileHeight: asset.mobileHeight,
            stickyToFooter: asset.stickyToFooter,
          } satisfies ThemeDecoration;
        });

  return {
    decorations,
    footer: {
      imageUrl: toRawImageUrl(
        layout.footer?.imageUrl ??
        colors?.footerImageUrl ??
        ""
      ),
      height:
        layout.footer?.height ??
        colors?.footerImageHeight ??
        DEFAULT_FOOTER_HEIGHT,
      align: layout.footer?.align ?? "bottom",
    },
  };
}

export function buildThemeLayoutFromDecorations(
  decorations: ThemeDecoration[],
  footer?: ThemeFooterConfig,
): ThemeLayoutConfig {
  return {
    version: 2,
    decorations,
    footer: footer || {},
  };
}

function shrinkRect(rect: ThemeRect, padding: { top: number; right: number; bottom: number; left: number }): ThemeRect {
  return {
    top: rect.top + padding.top,
    left: rect.left + padding.left,
    width: Math.max(0, rect.width - padding.left - padding.right),
    height: Math.max(0, rect.height - padding.top - padding.bottom),
  };
}

export function createThemeSceneMetrics(params: {
  width: number;
  height: number;
  mode: ThemeViewportMode;
  footerHeight?: number;
  questionRect?: Partial<ThemeRect>;
  contentRect?: Partial<ThemeRect>;
  navigationRect?: Partial<ThemeRect>;
  headerRect?: Partial<ThemeRect>;
}): ThemeSceneMetrics {
  const { width, height, mode } = params;
  const safeArea =
    mode === "mobile"
      ? { top: 24, right: 16, bottom: 24, left: 16 }
      : { top: 32, right: 32, bottom: 32, left: 32 };

  const footerHeight = params.footerHeight ?? DEFAULT_FOOTER_HEIGHT;
  const navHeight =
    (params.navigationRect?.height && params.navigationRect.height > 0)
      ? params.navigationRect.height
      : (mode === "mobile" ? 88 : 0);
  const questionTop =
    params.questionRect?.top ??
    (mode === "mobile" ? 124 : Math.max(120, height * 0.24));
  const questionHeight =
    params.questionRect?.height ??
    clamp(mode === "mobile" ? height * 0.42 : height * 0.32, 180, height * 0.5);
  const contentTop =
    params.contentRect?.top ??
    Math.max(safeArea.top + 36, questionTop - 96);
  const contentBottomPadding = Math.max(navHeight + safeArea.bottom + 20, footerHeight + safeArea.bottom + 12);
  const contentHeight =
    params.contentRect?.height ??
    Math.max(0, height - contentTop - contentBottomPadding);

  const zones: Record<ThemeZone, ThemeRect> = {
    header: {
      top: params.headerRect?.top ?? safeArea.top,
      left: safeArea.left,
      width: width - safeArea.left - safeArea.right,
      height: params.headerRect?.height ?? Math.max(72, contentTop - safeArea.top - 16),
    },
    content: {
      top: contentTop,
      left: safeArea.left,
      width: width - safeArea.left - safeArea.right,
      height: contentHeight,
    },
    decoration: {
      top: safeArea.top,
      left: safeArea.left,
      width: width - safeArea.left - safeArea.right,
      height: height - safeArea.top - safeArea.bottom,
    },
    footer: {
      top: height - footerHeight - navHeight,
      left: 0,
      width,
      height: footerHeight,
    },
    navigation: {
      top: height - navHeight,
      left: safeArea.left,
      width: width - safeArea.left - safeArea.right,
      height: navHeight,
    },
  };

  const questionRect: ThemeRect = {
    top: params.questionRect?.top ?? questionTop,
    left: params.questionRect?.left ?? safeArea.left,
    width:
      params.questionRect?.width ??
      Math.min(width - safeArea.left - safeArea.right, mode === "mobile" ? width - 32 : 768),
    height: questionHeight,
  };

  return {
    width,
    height,
    safeArea,
    zones,
    anchors: {
      "screen-edge": { top: 0, left: 0, width, height },
      "safe-area": shrinkRect({ top: 0, left: 0, width, height }, safeArea),
      header: zones.header,
      content: zones.content,
      "question-area": questionRect,
      footer: zones.footer,
      "bottom-navigation": zones.navigation,
    },
  };
}

function rectForDecoration(
  metrics: ThemeSceneMetrics,
  decoration: ThemeDecoration,
) {
  const zone = decoration.zone ?? inferZoneFromLegacyY(50, decoration.stickyToFooter);
  const anchor = decoration.anchor ?? inferAnchor(zone);
  return metrics.anchors[anchor] ?? metrics.zones[zone] ?? metrics.anchors["safe-area"];
}

function resolveLength(
  value: number | undefined,
  fallback: number,
  reference: number,
) {
  if (typeof value !== "number") return `${fallback}px`;
  if (value <= 100) {
    return `${Math.max(reference * (value / 100), 24)}px`;
  }
  return `${value}px`;
}

function resolveOffset(
  desktopValue: number | undefined,
  mobileValue: number | undefined,
  mode: ThemeViewportMode,
  isFooterAnchor = false,
) {
  if (mode === "mobile") {
    if (typeof mobileValue === "number") return mobileValue;
    if (typeof desktopValue === "number") {
      if (isFooterAnchor) return desktopValue;
      return Math.round(desktopValue * 0.72);
    }
    return 0;
  }

  return desktopValue ?? 0;
}

export function getDecorationStyle(
  decoration: ThemeDecoration,
  metrics: ThemeSceneMetrics,
  mode: ThemeViewportMode,
) {
  const rect = rectForDecoration(metrics, decoration);
  const alignX = decoration.alignX ?? "center";
  const isFooter =
    decoration.zone === "footer" || decoration.anchor === "footer";
  const alignY = isFooter
    ? decoration.alignY ?? "bottom"
    : decoration.alignY ?? "middle";

  // Use a stable reference width for footer decorations to prevent size changes based on monitor resolution
  const refWidth =
    decoration.zone === "footer" || decoration.anchor === "footer"
      ? (mode === "mobile" ? 390 : 860)
      : rect.width;

  const fallbackWidth = mode === "mobile" ? 65 : 144;

  const width = resolveLength(
    mode === "mobile" ? decoration.mobileWidth ?? decoration.width : decoration.width,
    fallbackWidth,
    refWidth,
  );
  const height =
    typeof (mode === "mobile" ? decoration.mobileHeight ?? decoration.height : decoration.height) === "number"
      ? `${mode === "mobile" ? decoration.mobileHeight ?? decoration.height : decoration.height}px`
      : "auto";
  const offsetX = resolveOffset(decoration.offsetX, decoration.mobileOffsetX, mode, isFooter);
  const offsetY = resolveOffset(decoration.offsetY, decoration.mobileOffsetY, mode, isFooter);
  const scale = mode === "mobile" ? decoration.mobileScale ?? decoration.scale ?? 1 : decoration.scale ?? 1;

  const anchorX =
    alignX === "left"
      ? rect.left
      : alignX === "right"
        ? rect.left + rect.width
        : rect.left + rect.width / 2;
  const anchorY =
    alignY === "top"
      ? rect.top
      : alignY === "bottom"
        ? rect.top + rect.height
        : rect.top + rect.height / 2;

  return {
    left: `${anchorX}px`,
    top: `${anchorY}px`,
    width,
    height,
    opacity: `${decoration.opacity ?? 1}`,
    transform: `translate(${alignX === "left" ? "0" : alignX === "right" ? "-100%" : "-50%"}, ${alignY === "top" ? "0" : alignY === "bottom" ? "-100%" : "-50%"}) translate(${offsetX}px, ${offsetY}px) rotate(${decoration.rotate ?? 0}deg) scale(${scale})`,
  };
}
