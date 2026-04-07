import type {
  DrawShapeCommand,
  DrawSpeechBubbleCommand,
  DrawTextCommand,
  FitMode,
  InputDefinition,
  PresetDocument,
} from "../dsl-schema";

type RenderImageValue = {
  kind: "image";
  url: string;
};

type RenderTextValue = string;

export type RenderInputValue = RenderImageValue | RenderTextValue | null | undefined;

export type { RenderImageValue };

export type RenderInputs = Record<string, RenderInputValue>;

type SceneNode =
  | {
      kind: "shape";
      id?: string;
      zIndex: number;
      visibleWhen?: string;
      command: DrawShapeCommand;
    }
  | {
      kind: "image";
      id?: string;
      zIndex: number;
      visibleWhen?: string;
      source: string;
      x: number;
      y: number;
      width: number;
      height: number;
      fit: FitMode;
      angle?: number;
      opacity?: number;
      maskRadius?: number;
      filter?: string;
    }
  | {
      kind: "text";
      id?: string;
      zIndex: number;
      visibleWhen?: string;
      command: DrawTextCommand;
    }
  | {
      kind: "speechBubble";
      id?: string;
      zIndex: number;
      visibleWhen?: string;
      command: DrawSpeechBubbleCommand;
    };

interface SceneState {
  width: number;
  height: number;
  backgroundColor: string;
  nodes: SceneNode[];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

function evaluateVisibleWhen(expression: string | undefined, inputs: RenderInputs): boolean {
  if (!expression) {
    return true;
  }

  try {
    return Boolean(new Function("inputs", `return (${expression});`)(inputs));
  } catch {
    return false;
  }
}

function getInputDefinition(preset: PresetDocument, name: string): InputDefinition | undefined {
  return preset.inputs.find((input) => input.name === name);
}

function resolveTextValue(
  preset: PresetDocument,
  source: string | undefined,
  fallbackText: string | undefined,
  inputs: RenderInputs,
): string {
  if (source) {
    const value = inputs[source];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }

    const input = getInputDefinition(preset, source);
    return input?.label ?? source;
  }

  return fallbackText ?? "";
}

function resolveImageUrl(source: string, inputs: RenderInputs): string | null {
  const inputValue = inputs[source];
  if (inputValue && typeof inputValue === "object" && inputValue.kind === "image") {
    return inputValue.url;
  }

  return null;
}

function buildScene(preset: PresetDocument): SceneState {
  const scene: SceneState = {
    width: preset.output.width,
    height: preset.output.height,
    backgroundColor: preset.output.backgroundColor ?? "#ffffff",
    nodes: [],
  };

  const imageNodes = new Map<string, Extract<SceneNode, { kind: "image" }>>();

  preset.commands.forEach((command, index) => {
    const zIndex = command.zIndex ?? index;

    switch (command.op) {
      case "createCanvas":
        scene.width = command.width;
        scene.height = command.height;
        scene.backgroundColor = command.backgroundColor ?? scene.backgroundColor;
        break;
      case "drawShape":
        scene.nodes.push({
          kind: "shape",
          id: command.id,
          zIndex,
          visibleWhen: command.visibleWhen,
          command,
        });
        break;
      case "placeImage": {
        const node: Extract<SceneNode, { kind: "image" }> = {
          kind: "image",
          id: command.id,
          zIndex,
          visibleWhen: command.visibleWhen,
          source: command.source,
          x: command.x,
          y: command.y,
          width: command.width,
          height: command.height,
          fit: command.fit ?? "cover",
          angle: command.angle,
          opacity: command.opacity,
        };
        scene.nodes.push(node);
        if (command.id) {
          imageNodes.set(command.id, node);
        }
        break;
      }
      case "maskImage": {
        const node = imageNodes.get(command.target);
        if (node && command.shape === "roundRect") {
          node.maskRadius = command.radius ?? 0;
        }
        break;
      }
      case "applyFilter": {
        const node = imageNodes.get(command.target);
        if (node) {
          const filters = command.filters.map((entry) => {
            switch (entry.type) {
              case "brightness":
                return `brightness(${1 + (entry.amount ?? 0)})`;
              case "contrast":
                return `contrast(${1 + (entry.amount ?? 0)})`;
              case "blur":
                return `blur(${Math.max(0, entry.amount ?? 0)}px)`;
              case "grayscale":
                return `grayscale(1)`;
              case "sepia":
                return `sepia(${Math.max(0, entry.amount ?? 1)})`;
              case "invert":
                return entry.enabled ? "invert(1)" : "";
              case "saturation":
                return `saturate(${1 + (entry.amount ?? 0)})`;
              default:
                return "";
            }
          });

          node.filter = filters.filter(Boolean).join(" ");
        }
        break;
      }
      case "drawText":
        scene.nodes.push({
          kind: "text",
          id: command.id,
          zIndex,
          visibleWhen: command.visibleWhen,
          command,
        });
        break;
      case "drawSticker":
        scene.nodes.push({
          kind: "image",
          id: command.id,
          zIndex,
          visibleWhen: command.visibleWhen,
          source: command.source,
          x: command.x,
          y: command.y,
          width: command.width,
          height: command.height,
          fit: "contain",
          angle: command.angle,
          opacity: command.opacity,
        });
        break;
      case "drawSpeechBubble":
        scene.nodes.push({
          kind: "speechBubble",
          id: command.id,
          zIndex,
          visibleWhen: command.visibleWhen,
          command,
        });
        break;
      case "setOpacity": {
        const node = imageNodes.get(command.target);
        if (node) {
          node.opacity = command.opacity;
        }
        break;
      }
      default:
        break;
    }
  });

  scene.nodes.sort((a, b) => a.zIndex - b.zIndex);
  return scene;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = Infinity,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || current.length === 0) {
      current = next;
      return;
    }

    lines.push(current);
    current = word;
  });

  if (current) {
    lines.push(current);
  }

  return lines.slice(0, maxLines);
}

function toCanvasTextAlign(value: DrawTextCommand["style"]["textAlign"]): CanvasTextAlign {
  if (value === "center" || value === "right") {
    return value;
  }

  return "left";
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 0,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawShape(ctx: CanvasRenderingContext2D, command: DrawShapeCommand) {
  const radius = typeof command.style.cornerRadius === "number" ? command.style.cornerRadius : 0;
  const width = command.width ?? 0;
  const height = command.height ?? 0;

  ctx.save();
  ctx.globalAlpha = command.opacity ?? 1;

  if (command.shape === "roundRect" || command.shape === "rect") {
    drawRoundedRect(ctx, command.x, command.y, width, height, command.shape === "roundRect" ? radius : 0);
  } else if (command.shape === "circle") {
    ctx.beginPath();
    ctx.arc(command.x + width / 2, command.y + width / 2, width / 2, 0, Math.PI * 2);
  } else if (command.shape === "ellipse") {
    ctx.beginPath();
    ctx.ellipse(command.x + width / 2, command.y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
  } else {
    ctx.restore();
    return;
  }

  if (command.style.fill) {
    ctx.fillStyle = command.style.fill;
    ctx.fill();
  }

  if (command.style.stroke) {
    ctx.strokeStyle = command.style.stroke.color;
    ctx.lineWidth = command.style.stroke.width ?? 1;
    ctx.stroke();
  }

  ctx.restore();
}

function drawPlaceholderImage(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
) {
  ctx.save();
  ctx.fillStyle = "#efe4d6";
  ctx.strokeStyle = "#b89877";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.setLineDash([]);
  ctx.fillStyle = "#7f654f";
  ctx.font = `600 ${Math.max(16, Math.min(width, height) * 0.08)}px Pretendard, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + width / 2, y + height / 2, width - 24);
  ctx.restore();
}

function drawTextNode(
  ctx: CanvasRenderingContext2D,
  preset: PresetDocument,
  command: DrawTextCommand,
  inputs: RenderInputs,
) {
  const text = resolveTextValue(preset, command.source, command.text, inputs);
  const fontWeight = command.style.fontWeight ?? "normal";
  const fontStyle = command.style.fontStyle ?? "normal";

  ctx.save();
  ctx.globalAlpha = command.opacity ?? 1;
  ctx.font = `${fontStyle} ${fontWeight} ${command.style.fontSize}px ${command.style.fontFamily}`;
  ctx.fillStyle = command.style.fill;
  ctx.textAlign = toCanvasTextAlign(command.style.textAlign);
  ctx.textBaseline = "top";

  if (command.style.stroke) {
    ctx.strokeStyle = command.style.stroke.color;
    ctx.lineWidth = command.style.stroke.width ?? 1;
  }

  const lines = wrapText(ctx, text, command.width, command.maxLines);
  const lineHeight = command.style.lineHeight
    ? command.style.fontSize * command.style.lineHeight
    : command.style.fontSize * 1.2;
  const drawX =
    command.style.textAlign === "center"
      ? command.x + command.width / 2
      : command.style.textAlign === "right"
        ? command.x + command.width
        : command.x;

  lines.forEach((line, index) => {
    const y = command.y + index * lineHeight;
    if (command.style.stroke) {
      ctx.strokeText(line, drawX, y, command.width);
    }
    ctx.fillText(line, drawX, y, command.width);
  });
  ctx.restore();
}

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  preset: PresetDocument,
  command: DrawSpeechBubbleCommand,
  inputs: RenderInputs,
) {
  const radius = typeof command.style.cornerRadius === "number" ? command.style.cornerRadius : 24;
  const text = resolveTextValue(preset, command.source, command.text, inputs);
  const tailWidth = command.tail?.size?.width ?? 32;
  const tailHeight = command.tail?.size?.height ?? 24;
  const tailX = command.x + 48;
  const tailY = command.y + command.height;

  ctx.save();
  ctx.globalAlpha = command.opacity ?? 1;
  drawRoundedRect(ctx, command.x, command.y, command.width, command.height, radius);
  if (command.style.fill) {
    ctx.fillStyle = command.style.fill;
    ctx.fill();
  }
  if (command.style.stroke) {
    ctx.strokeStyle = command.style.stroke.color;
    ctx.lineWidth = command.style.stroke.width ?? 1;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(tailX + tailWidth, tailY);
  ctx.lineTo(tailX + tailWidth / 2, tailY + tailHeight);
  ctx.closePath();
  if (command.style.fill) {
    ctx.fillStyle = command.style.fill;
    ctx.fill();
  }
  if (command.style.stroke) {
    ctx.strokeStyle = command.style.stroke.color;
    ctx.lineWidth = command.style.stroke.width ?? 1;
    ctx.stroke();
  }

  ctx.font = `${command.textStyle.fontWeight ?? "normal"} ${command.textStyle.fontSize}px ${command.textStyle.fontFamily}`;
  ctx.fillStyle = command.textStyle.fill;
  ctx.textAlign = command.textStyle.textAlign === "left" || command.textStyle.textAlign === "right"
    ? command.textStyle.textAlign
    : "center";
  ctx.textBaseline = "middle";
  const lines = wrapText(ctx, text, command.width - (command.padding ?? 16) * 2, 3);
  const lineHeight = command.textStyle.lineHeight
    ? command.textStyle.fontSize * command.textStyle.lineHeight
    : command.textStyle.fontSize * 1.2;
  const centerY = command.y + command.height / 2 - ((lines.length - 1) * lineHeight) / 2;
  const textX =
    command.textStyle.textAlign === "left"
      ? command.x + (command.padding ?? 16)
      : command.textStyle.textAlign === "right"
        ? command.x + command.width - (command.padding ?? 16)
        : command.x + command.width / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, textX, centerY + index * lineHeight, command.width - (command.padding ?? 16) * 2);
  });
  ctx.restore();
}

async function drawImageNode(
  ctx: CanvasRenderingContext2D,
  preset: PresetDocument,
  node: Extract<SceneNode, { kind: "image" }>,
  inputs: RenderInputs,
) {
  const imageUrl = resolveImageUrl(node.source, inputs);

  ctx.save();
  ctx.globalAlpha = node.opacity ?? 1;
  ctx.filter = node.filter ?? "none";

  if (node.maskRadius) {
    drawRoundedRect(ctx, node.x, node.y, node.width, node.height, node.maskRadius);
    ctx.clip();
  }

  if (!imageUrl) {
    const input = getInputDefinition(preset, node.source);
    drawPlaceholderImage(ctx, node.x, node.y, node.width, node.height, input?.label ?? node.source);
    ctx.restore();
    return;
  }

  const image = await loadImage(imageUrl);
  let dx = node.x;
  let dy = node.y;
  let dWidth = node.width;
  let dHeight = node.height;

  if (node.fit === "contain") {
    const scale = Math.min(node.width / image.width, node.height / image.height);
    dWidth = image.width * scale;
    dHeight = image.height * scale;
    dx = node.x + (node.width - dWidth) / 2;
    dy = node.y + (node.height - dHeight) / 2;
  }

  ctx.drawImage(image, dx, dy, dWidth, dHeight);
  ctx.restore();
}

export async function renderPresetToCanvas(
  canvas: HTMLCanvasElement,
  preset: PresetDocument,
  inputs: RenderInputs,
) {
  const scene = buildScene(preset);
  canvas.width = scene.width;
  canvas.height = scene.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  ctx.clearRect(0, 0, scene.width, scene.height);
  ctx.fillStyle = scene.backgroundColor;
  ctx.fillRect(0, 0, scene.width, scene.height);

  for (const node of scene.nodes) {
    if (!evaluateVisibleWhen(node.visibleWhen, inputs)) {
      continue;
    }

    if (node.kind === "shape") {
      drawShape(ctx, node.command);
      continue;
    }

    if (node.kind === "text") {
      drawTextNode(ctx, preset, node.command, inputs);
      continue;
    }

    if (node.kind === "speechBubble") {
      drawSpeechBubble(ctx, preset, node.command, inputs);
      continue;
    }

    await drawImageNode(ctx, preset, node, inputs);
  }
}
