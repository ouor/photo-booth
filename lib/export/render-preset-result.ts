import type { OverlayItem } from "@/lib/overlay-editor";
import { renderPresetToCanvas, type RenderInputs } from "@/lib/preset-engine";
import type { ExportModel, RenderModel } from "@/lib/preset-compiler";

export async function renderPresetResultDataUrl(params: {
  renderModel: RenderModel;
  exportModel: ExportModel;
  inputs: RenderInputs;
  overlays: OverlayItem[];
  type?: "image/png" | "image/jpeg" | "image/webp";
  quality?: number;
}) {
  const {
    renderModel,
    exportModel,
    inputs,
    overlays,
    type = exportModel.format,
    quality,
  } = params;

  const exportCanvas = document.createElement("canvas");
  await renderPresetToCanvas(exportCanvas, renderModel, inputs, overlays);

  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = exportModel.bounds.width;
  croppedCanvas.height = exportModel.bounds.height;

  const croppedContext = croppedCanvas.getContext("2d");
  if (!croppedContext) {
    throw new Error("Failed to create export context.");
  }

  croppedContext.drawImage(
    exportCanvas,
    exportModel.bounds.x,
    exportModel.bounds.y,
    exportModel.bounds.width,
    exportModel.bounds.height,
    0,
    0,
    exportModel.bounds.width,
    exportModel.bounds.height,
  );

  return croppedCanvas.toDataURL(type, quality);
}
