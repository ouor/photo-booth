import type {
  DrawTextCommand,
  ImageInputDefinition,
  PresetDocument,
  TextInputDefinition,
} from "../dsl-schema";

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
