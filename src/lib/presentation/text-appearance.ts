import type { EditorModel } from "../preset-compiler";

export interface TextAppearance {
  color: string;
  textShadow: string;
}

export type TextAppearanceMap = Record<string, TextAppearance>;

export function sampleTextAppearanceMap(
  canvas: HTMLCanvasElement,
  editorModel: EditorModel,
): TextAppearanceMap {
  const context = canvas.getContext("2d");
  if (!context) {
    return {};
  }

  const nextContrastMap: TextAppearanceMap = {};

  editorModel.textSlots.forEach((slot) => {
    if (slot.appearanceScope === "preset") {
      nextContrastMap[slot.inputName] = {
        color: slot.style.fill,
        textShadow: "none",
      };
      return;
    }

    const sampleX = Math.max(0, Math.floor(slot.x));
    const sampleY = Math.max(0, Math.floor(slot.y));
    const sampleWidth = Math.max(1, Math.min(canvas.width - sampleX, Math.floor(slot.width)));
    const sampleHeight = Math.max(1, Math.min(canvas.height - sampleY, Math.floor(slot.height)));

    try {
      const { data } = context.getImageData(sampleX, sampleY, sampleWidth, sampleHeight);
      let totalLuminance = 0;
      const pixelCount = data.length / 4;

      for (let index = 0; index < data.length; index += 4) {
        const red = data[index] / 255;
        const green = data[index + 1] / 255;
        const blue = data[index + 2] / 255;
        totalLuminance += 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      }

      const averageLuminance = pixelCount > 0 ? totalLuminance / pixelCount : 1;
      const useDarkText = averageLuminance > 0.62;

      nextContrastMap[slot.inputName] = useDarkText
        ? { color: "#171717", textShadow: "0 1px 2px rgba(255,255,255,0.35)" }
        : { color: "#fffdf8", textShadow: "0 1px 3px rgba(0,0,0,0.45)" };
    } catch {
      nextContrastMap[slot.inputName] = {
        color: "#fffdf8",
        textShadow: "0 1px 3px rgba(0,0,0,0.45)",
      };
    }
  });

  return nextContrastMap;
}
