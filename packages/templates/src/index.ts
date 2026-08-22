import { ClassicGold } from "./ClassicGold";
import { ModernMinimal } from "./ModernMinimal";
import { RomanticBlush } from "./RomanticBlush";
import { ShareStoryModal } from "./ShareStoryModal";

export * from "./types";
export { ClassicGold, ModernMinimal, RomanticBlush, ShareStoryModal };

export const TEMPLATES = {
  "classic-gold": ClassicGold,
  "modern-minimal": ModernMinimal,
  "romantic-blush": RomanticBlush,
} as const;

export const TEMPLATE_LIST = [
  {
    id: "classic-gold",
    name: "Classic Gold & Elegant Floral",
    description: "Serif typography, gold accents, floral background reveals.",
    defaultTheme: {
      colorPrimary: "#d4af37",
      colorAccent: "#b8860b",
      colorBg: "#fffdf9",
      colorText: "#2c2c2c",
      fontHeading: "Playfair Display",
      fontBody: "Inter",
      radius: "8px",
      pattern: "floral",
    }
  },
  {
    id: "modern-minimal",
    name: "Modern Minimalist",
    description: "Sleek sans-serif, sharp corners, monochrome grids, clean margins.",
    defaultTheme: {
      colorPrimary: "#3f3f46",
      colorAccent: "#18181b",
      colorBg: "#f4f4f5",
      colorText: "#09090b",
      fontHeading: "Space Grotesk",
      fontBody: "Inter",
      radius: "0px",
      pattern: "clean",
    }
  },
  {
    id: "romantic-blush",
    name: "Romantic Blush",
    description: "Peach-rose pastels, calligraphy heading, soft rounded cards.",
    defaultTheme: {
      colorPrimary: "#db2777",
      colorAccent: "#f472b6",
      colorBg: "#fff5f5",
      colorText: "#4c0519",
      fontHeading: "Pinyon Script",
      fontBody: "Inter",
      radius: "24px",
      pattern: "hearts",
    }
  }
] as const;
