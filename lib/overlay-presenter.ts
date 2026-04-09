import type { OverlayAssetOption, OverlayItem } from "./overlay-editor";

export type OverlayInspectorControl =
  | {
      type: "range";
      key: "x" | "y" | "size" | "rotation";
      label: string;
      min: number;
      max: number;
      value: number;
    }
  | {
      type: "text";
      key: "text";
      label: string;
      value: string;
    };

function getOverlayBehavior(overlay: OverlayItem) {
  switch (overlay.kind) {
    case "speechBubble":
      return {
        sizeMode: "speechBubble" as const,
        textEditable: true,
        textFieldLabel: "Text",
      };
    case "emoji":
      return {
        sizeMode: "square" as const,
        textEditable: true,
        textFieldLabel: "Text",
      };
    case "sticker":
    case "badge":
      return {
        sizeMode: "square" as const,
        textEditable: false,
      };
  }
}

export function getOverlayKindLabel(kind: OverlayItem["kind"] | OverlayAssetOption["kind"]) {
  switch (kind) {
    case "speechBubble":
      return "Speech bubble";
    case "sticker":
      return "Sticker";
    case "badge":
      return "Badge";
    case "emoji":
      return "Emoji";
  }
}

export function getOverlayAssetMeta(asset: OverlayAssetOption) {
  return {
    title: asset.label,
    subtitle: getOverlayKindLabel(asset.kind),
  };
}

export function getOverlayListMeta(overlay: OverlayItem, index: number) {
  return {
    title: `${index + 1}. ${getOverlayKindLabel(overlay.kind)}`,
    subtitle: `${Math.round(overlay.x)}, ${Math.round(overlay.y)}`,
  };
}

export function getOverlayInspectorControls(overlay: OverlayItem): OverlayInspectorControl[] {
  const behavior = getOverlayBehavior(overlay);
  const controls: OverlayInspectorControl[] = [
    {
      type: "range",
      key: "x",
      label: "X Position",
      min: 0,
      max: 1080,
      value: overlay.x,
    },
    {
      type: "range",
      key: "y",
      label: "Y Position",
      min: 0,
      max: 1920,
      value: overlay.y,
    },
    {
      type: "range",
      key: "size",
      label: "Size",
      min: 48,
      max: 420,
      value: overlay.width,
    },
    {
      type: "range",
      key: "rotation",
      label: "Rotation",
      min: -45,
      max: 45,
      value: overlay.rotation,
    },
  ];

  if (behavior.textEditable) {
    controls.push({
      type: "text",
      key: "text",
      label: behavior.textFieldLabel ?? "Text",
      value: "text" in overlay ? overlay.text : "",
    });
  }

  return controls;
}

export function applyOverlayInspectorValue(
  overlay: OverlayItem,
  key: OverlayInspectorControl["key"],
  value: number | string,
): OverlayItem {
  const behavior = getOverlayBehavior(overlay);

  switch (key) {
    case "x":
      return { ...overlay, x: Number(value) };
    case "y":
      return { ...overlay, y: Number(value) };
    case "rotation":
      return { ...overlay, rotation: Number(value) };
    case "size": {
      const nextSize = Number(value);
      if (behavior.sizeMode === "speechBubble") {
        return {
          ...overlay,
          width: nextSize,
          height: Math.round(nextSize * 0.58),
        };
      }

      return {
        ...overlay,
        width: nextSize,
        height: nextSize,
      };
    }
    case "text":
      if ("text" in overlay) {
        return {
          ...overlay,
          text: String(value),
        };
      }
      return overlay;
  }
}
