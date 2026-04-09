import type {
  Command,
  InputDefinition,
  PresetDocument,
} from "../dsl-schema";

const commandOps = new Set<Command["op"]>([
  "createCanvas",
  "defineInput",
  "captureCamera",
  "placeImage",
  "cropImage",
  "maskImage",
  "drawFrame",
  "drawText",
  "drawSticker",
  "drawShape",
  "drawSpeechBubble",
  "transform",
  "applyFilter",
  "applyAnalogVideo",
  "setOpacity",
  "setBlendMode",
  "group",
  "repeat",
  "conditional",
  "exportImage",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validateInput(input: unknown, index: number): string[] {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return [`inputs[${index}] must be an object`];
  }

  if (typeof input.name !== "string" || input.name.length === 0) {
    errors.push(`inputs[${index}].name must be a non-empty string`);
  }

  if (typeof input.type !== "string") {
    errors.push(`inputs[${index}].type must be a string`);
    return errors;
  }

  const type = input.type as InputDefinition["type"];

  if (type === "sticker") {
    if (!Array.isArray(input.options) || input.options.length === 0) {
      errors.push(`inputs[${index}].options must be a non-empty array for sticker inputs`);
    }
  }

  if (type === "emoji" && input.allowed && !Array.isArray(input.allowed)) {
    errors.push(`inputs[${index}].allowed must be an array when provided`);
  }

  return errors;
}

function validateCommand(command: unknown, index: number): string[] {
  const errors: string[] = [];

  if (!isRecord(command)) {
    return [`commands[${index}] must be an object`];
  }

  if (typeof command.op !== "string" || !commandOps.has(command.op as Command["op"])) {
    errors.push(`commands[${index}].op is not supported`);
  }

  return errors;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export function validatePresetDocument(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { ok: false, errors: ["Preset must be an object"] };
  }

  if (typeof input.schemaVersion !== "string") {
    errors.push("schemaVersion must be a string");
  }

  if (!isRecord(input.metadata)) {
    errors.push("metadata must be an object");
  } else {
    if (typeof input.metadata.id !== "string") {
      errors.push("metadata.id must be a string");
    }

    if (typeof input.metadata.name !== "string") {
      errors.push("metadata.name must be a string");
    }

    if (typeof input.metadata.version !== "string") {
      errors.push("metadata.version must be a string");
    }
  }

  if (!Array.isArray(input.inputs)) {
    errors.push("inputs must be an array");
  } else {
    input.inputs.forEach((entry, index) => {
      errors.push(...validateInput(entry, index));
    });
  }

  if (!isRecord(input.output)) {
    errors.push("output must be an object");
  } else {
    if (typeof input.output.width !== "number") {
      errors.push("output.width must be a number");
    }

    if (typeof input.output.height !== "number") {
      errors.push("output.height must be a number");
    }

    if (typeof input.output.format !== "string") {
      errors.push("output.format must be a string");
    }
  }

  if (!Array.isArray(input.commands) || input.commands.length === 0) {
    errors.push("commands must be a non-empty array");
  } else {
    input.commands.forEach((entry, index) => {
      errors.push(...validateCommand(entry, index));
    });
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function assertPresetDocument(input: unknown): PresetDocument {
  const result = validatePresetDocument(input);

  if (!result.ok) {
    throw new Error(result.errors.join("\n"));
  }

  return input as PresetDocument;
}
