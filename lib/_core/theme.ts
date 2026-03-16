import { Platform } from "react-native";

import themeConfig from "@/theme.config";

export type ColorScheme = "light" | "dark";

export const ThemeColors = themeConfig.themeColors;

type ThemeColorTokens = typeof ThemeColors;
type ThemeColorName = keyof ThemeColorTokens;
type SchemePalette = Record<ColorScheme, Record<ThemeColorName, string>>;
type SchemePaletteItem = SchemePalette[ColorScheme];

function buildSchemePalette(colors: any): SchemePalette {
  const palette: SchemePalette = {
    light: {} as any,
    dark: {} as any,
  };

  const defaultColors = {
    background: "#ffffff",
    foreground: "#000000",
    primary: "#2563eb",
    muted: "#64748b",
    border: "#e2e8f0",
  };

  // If we have a flat structure (like in theme.config.js theme.colors)
  const flatColors = themeConfig?.theme?.colors || {};
  
  const mergedColors = {
    ...defaultColors,
    ...flatColors,
  };

  // Initialize with flat colors for both schemes as a baseline
  Object.keys(mergedColors).forEach(key => {
    palette.light[key] = mergedColors[key];
    palette.dark[key] = mergedColors[key];
  });

  // Overwrite with nested structure if it exists
  if (colors && typeof colors === 'object') {
    (Object.keys(colors) as ThemeColorName[]).forEach((name) => {
      const swatch = colors[name];
      if (swatch && typeof swatch === 'object') {
        if (swatch.light) palette.light[name] = swatch.light;
        if (swatch.dark) palette.dark[name] = swatch.dark;
      }
    });
  }

  // Ensure critical keys exist for buildRuntimePalette fallback
  const criticalKeys = ['background', 'foreground', 'primary', 'muted', 'border'];
  [palette.light, palette.dark].forEach(scheme => {
    criticalKeys.forEach(key => {
      if (!scheme[key]) scheme[key] = defaultColors[key as keyof typeof defaultColors];
    });
  });

  return palette;
}

export const SchemeColors = buildSchemePalette(ThemeColors);

type RuntimePalette = SchemePaletteItem & {
  text: string;
  background: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  border: string;
};

function buildRuntimePalette(scheme: ColorScheme): RuntimePalette {
  const base = SchemeColors[scheme];
  return {
    ...base,
    text: base.foreground,
    background: base.background,
    tint: base.primary,
    icon: base.muted,
    tabIconDefault: base.muted,
    tabIconSelected: base.primary,
    border: base.border,
  };
}

export const Colors = {
  light: buildRuntimePalette("light"),
  dark: buildRuntimePalette("dark"),
} satisfies Record<ColorScheme, RuntimePalette>;

export type ThemeColorPalette = (typeof Colors)[ColorScheme];

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
