import type { RenderModel } from "@/lib/preset-compiler";

export interface ImageFilterAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  sepia: number;
  grayscale: boolean;
}

export type ImageFilterAdjustmentMap = Record<string, ImageFilterAdjustments | undefined>;

export const defaultImageFilterAdjustments: ImageFilterAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
  sepia: 0,
  grayscale: false,
};

export function getImageFilterAdjustments(
  adjustments: ImageFilterAdjustmentMap,
  inputName: string,
): ImageFilterAdjustments {
  return adjustments[inputName] ?? defaultImageFilterAdjustments;
}

export function mergeFilterString(
  baseFilter: string | undefined,
  adjustments: ImageFilterAdjustments,
): string | undefined {
  const parts = baseFilter ? [baseFilter] : [];

  if (adjustments.brightness !== 0) {
    parts.push(`brightness(${1 + adjustments.brightness})`);
  }
  if (adjustments.contrast !== 0) {
    parts.push(`contrast(${1 + adjustments.contrast})`);
  }
  if (adjustments.saturation !== 0) {
    parts.push(`saturate(${1 + adjustments.saturation})`);
  }
  if (adjustments.blur > 0) {
    parts.push(`blur(${adjustments.blur}px)`);
  }
  if (adjustments.sepia > 0) {
    parts.push(`sepia(${adjustments.sepia})`);
  }
  if (adjustments.grayscale) {
    parts.push("grayscale(1)");
  }

  return parts.length > 0 ? parts.join(" ") : undefined;
}

export function applyImageFilterAdjustments(
  renderModel: RenderModel,
  adjustments: ImageFilterAdjustmentMap,
): RenderModel {
  return {
    ...renderModel,
    nodes: renderModel.nodes.map((node) => {
      if (node.kind !== "image") {
        return node;
      }

      return {
        ...node,
        filter: mergeFilterString(
          node.filter,
          getImageFilterAdjustments(adjustments, node.source),
        ),
      };
    }),
  };
}
