export type OverlayKind = "sticker" | "badge" | "emoji" | "speechBubble";

interface BaseOverlayItem {
  id: string;
  kind: OverlayKind;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface ImageOverlayItem extends BaseOverlayItem {
  kind: "sticker" | "badge";
  assetUrl: string;
  label: string;
}

export interface EmojiOverlayItem extends BaseOverlayItem {
  kind: "emoji";
  text: string;
}

export interface SpeechBubbleOverlayItem extends BaseOverlayItem {
  kind: "speechBubble";
  text: string;
}

export type OverlayItem =
  | ImageOverlayItem
  | EmojiOverlayItem
  | SpeechBubbleOverlayItem;

export interface OverlayAssetOption {
  id: string;
  label: string;
  assetUrl?: string;
  kind: OverlayKind;
  defaultText?: string;
}

export const overlayAssetLibrary: OverlayAssetOption[] = [
  { id: "star-yellow", label: "Yellow Star", assetUrl: "/stickers/star-yellow.svg", kind: "sticker" },
  { id: "heart-red", label: "Red Heart", assetUrl: "/stickers/heart-red.svg", kind: "sticker" },
  { id: "sparkle-white", label: "Sparkle", assetUrl: "/stickers/sparkle-white.svg", kind: "sticker" },
  { id: "ribbon-pink", label: "Ribbon", assetUrl: "/stickers/ribbon-pink.svg", kind: "sticker" },
  { id: "verified-blue", label: "Verified Badge", assetUrl: "/stickers/verified-blue.svg", kind: "badge" },
  { id: "clover-green", label: "Clover Badge", assetUrl: "/stickers/clover-green.svg", kind: "badge" },
  { id: "emoji-fire", label: "Fire Emoji", kind: "emoji", defaultText: "🔥" },
  { id: "emoji-laugh", label: "Laugh Emoji", kind: "emoji", defaultText: "😂" },
  { id: "emoji-cool", label: "Cool Emoji", kind: "emoji", defaultText: "😎" },
  { id: "bubble-classic", label: "Speech Bubble", kind: "speechBubble", defaultText: "Say something" },
];

export function createOverlayItem(option: OverlayAssetOption): OverlayItem {
  const common = {
    id: `${option.kind}-${crypto.randomUUID()}`,
    x: 120,
    y: 120,
    width: option.kind === "speechBubble" ? 240 : 120,
    height: option.kind === "speechBubble" ? 140 : 120,
    rotation: 0,
  };

  if (option.kind === "emoji") {
    return {
      ...common,
      kind: "emoji",
      text: option.defaultText ?? "🔥",
    };
  }

  if (option.kind === "speechBubble") {
    return {
      ...common,
      kind: "speechBubble",
      text: option.defaultText ?? "Say something",
    };
  }

  return {
    ...common,
    kind: option.kind,
    label: option.label,
    assetUrl: option.assetUrl ?? "",
  };
}

export function getOverlayBounds(overlay: OverlayItem) {
  return {
    left: overlay.x,
    top: overlay.y,
    right: overlay.x + overlay.width,
    bottom: overlay.y + overlay.height,
  };
}

export function findOverlayAtPoint(overlays: OverlayItem[], x: number, y: number): OverlayItem | undefined {
  for (let index = overlays.length - 1; index >= 0; index -= 1) {
    const overlay = overlays[index];
    const bounds = getOverlayBounds(overlay);
    if (x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom) {
      return overlay;
    }
  }

  return undefined;
}
