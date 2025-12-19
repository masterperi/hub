import { Platform } from "react-native";

export const Colors = {
  primary: {
    main: "#2563EB",
    pressed: "#1D4ED8",
    light: "#3B82F6",
  },
  secondary: {
    main: "#7C3AED",
    pressed: "#6D28D9",
  },
  status: {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },
  light: {
    text: "#111827",
    textSecondary: "#6B7280",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6B7280",
    tabIconSelected: "#2563EB",
    link: "#2563EB",
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F9FAFB",
    backgroundSecondary: "#F3F4F6",
    backgroundTertiary: "#E5E7EB",
    border: "#E5E7EB",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#A3AED0",
    buttonText: "#FFFFFF",
    tabIconDefault: "#A3AED0",
    tabIconSelected: "#4318FF",
    link: "#4318FF",
    backgroundRoot: "#0B1437",
    backgroundDefault: "#111C44",
    backgroundSecondary: "#1B254B",
    backgroundTertiary: "#2B3674",
    border: "#2B3674",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  inputHeight: 48,
  buttonHeight: 48,
  fabSize: 56,
  tabBarHeight: Platform.select({ ios: 60, android: 56, default: 60 }),
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 28,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
};

export const Shadows = Platform.select({
  web: {
    card: {
      boxShadow: "0px 2px 2px rgba(0, 0, 0, 0.1)",
    },
    fab: {
      boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.15)",
    },
    modal: {
      boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.2)",
    },
  },
  default: {
    card: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    fab: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    modal: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
    },
  },
});

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
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
