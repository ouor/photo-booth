import type {
  Command,
  DrawTextCommand,
  ImageInputDefinition,
  PresetDocument,
  TextInputDefinition,
} from "../dsl-schema";
import type { OverlayItem } from "./overlay-editor";

export interface EditableImageSlot {
  inputName: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EditableTextSlot {
  inputName: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  maxLines?: number;
  style: DrawTextCommand["style"];
}

export interface PresetEditorModel {
  imageSlots: EditableImageSlot[];
  textSlots: EditableTextSlot[];
}

export interface ExportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function estimateTextHeight(command: DrawTextCommand): number {
  const fontSize = command.style.fontSize;
  const lineHeight = command.style.lineHeight ?? 1.2;
  const maxLines = command.maxLines ?? 1;
  return Math.ceil(fontSize * lineHeight * maxLines + 12);
}

export function derivePresetEditorModel(preset: PresetDocument): PresetEditorModel {
  const imageInputs = new Map<string, ImageInputDefinition>();
  const textInputs = new Map<string, TextInputDefinition>();

  preset.inputs.forEach((input) => {
    if (input.type === "image") {
      imageInputs.set(input.name, input);
    }

    if (input.type === "text") {
      textInputs.set(input.name, input);
    }
  });

  const imageSlots: EditableImageSlot[] = [];
  const textSlots: EditableTextSlot[] = [];

  preset.commands.forEach((command) => {
    if (command.op === "placeImage" && imageInputs.has(command.source)) {
      const input = imageInputs.get(command.source);
      imageSlots.push({
        inputName: command.source,
        label: input?.label ?? command.source,
        x: command.x,
        y: command.y,
        width: command.width,
        height: command.height,
      });
    }

    if (command.op === "drawText" && command.source && textInputs.has(command.source)) {
      const input = textInputs.get(command.source);
      textSlots.push({
        inputName: command.source,
        label: input?.label ?? command.source,
        x: command.x,
        y: command.y,
        width: command.width,
        height: estimateTextHeight(command),
        maxLines: command.maxLines,
        style: command.style,
      });
    }
  });

  return {
    imageSlots,
    textSlots,
  };
}

function getCommandBounds(command: Command, textSlots: EditableTextSlot[]): ExportBounds | null {
  switch (command.op) {
    case "drawShape":
    case "placeImage":
    case "drawFrame":
    case "drawSticker":
    case "drawSpeechBubble":
      return {
        x: command.x,
        y: command.y,
        width: command.width ?? 0,
        height: command.height ?? 0,
      };
    case "drawText": {
      if (!command.source) {
        return {
          x: command.x,
          y: command.y,
          width: command.width,
          height: estimateTextHeight(command),
        };
      }

      const matchingSlot = textSlots.find((slot) => slot.inputName === command.source);
      return {
        x: command.x,
        y: command.y,
        width: command.width,
        height: matchingSlot?.height ?? estimateTextHeight(command),
      };
    }
    default:
      return null;
  }
}

function getOverlayBounds(overlay: OverlayItem): ExportBounds {
  return {
    x: overlay.x,
    y: overlay.y,
    width: overlay.width,
    height: overlay.height,
  };
}

export function deriveExportBounds(
  preset: PresetDocument,
  editorModel: PresetEditorModel,
  overlays: OverlayItem[],
): ExportBounds {
  const allBounds = [
    ...preset.commands
      .map((command) => getCommandBounds(command, editorModel.textSlots))
      .filter((bounds): bounds is ExportBounds => bounds !== null),
    ...overlays.map(getOverlayBounds),
  ];

  if (allBounds.length === 0) {
    return {
      x: 0,
      y: 0,
      width: preset.output.width,
      height: preset.output.height,
    };
  }

  const minX = Math.max(0, Math.min(...allBounds.map((bounds) => bounds.x)));
  const minY = Math.max(0, Math.min(...allBounds.map((bounds) => bounds.y)));
  const maxX = Math.min(
    preset.output.width,
    Math.max(...allBounds.map((bounds) => bounds.x + bounds.width)),
  );
  const maxY = Math.min(
    preset.output.height,
    Math.max(...allBounds.map((bounds) => bounds.y + bounds.height)),
  );

  return {
    x: Math.floor(minX),
    y: Math.floor(minY),
    width: Math.ceil(maxX - minX),
    height: Math.ceil(maxY - minY),
  };
}
