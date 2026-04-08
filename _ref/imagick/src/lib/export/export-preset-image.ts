import type { OverlayItem } from "../overlay-editor";
import { renderPresetToCanvas, type RenderInputs } from "../preset-engine";
import type { ExportModel, RenderModel } from "../preset-compiler";

export async function exportPresetImage(params: {
  renderModel: RenderModel;
  exportModel: ExportModel;
  inputs: RenderInputs;
  overlays: OverlayItem[];
  filename: string;
}) {
  const { renderModel, exportModel, inputs, overlays, filename } = params;

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

  return new Promise<void>((resolve, reject) => {
    croppedCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to encode export image."));
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      resolve();
    }, exportModel.format);
  });
}
