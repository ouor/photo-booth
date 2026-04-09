import type { OverlayItem } from "./overlay-editor";
import { applyAnalogVideoEffects } from "./analog-video";
import type {
  ImageRenderNode,
  RenderModel,
  ShapeRenderNode,
  SpeechBubbleRenderNode,
  TextRenderNode,
} from "./preset-compiler";

type RenderImageValue = {
  kind: "image";
  url: string;
};

type RenderTextValue = string;

export type RenderInputValue = RenderImageValue | RenderTextValue | null | undefined;

export type { RenderImageValue };

export type RenderInputs = Record<string, RenderInputValue>;

interface RenderOptions {
  shouldAbort?: () => boolean;
  hiddenTextInputs?: string[];
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

function resolveTextValue(
  node: TextRenderNode | SpeechBubbleRenderNode,
  inputs: RenderInputs,
): string {
  if (node.source) {
    const value = inputs[node.source];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }

    return node.placeholderLabel ?? node.source;
  }

  return node.text ?? "";
}

function resolveImageUrl(source: string, inputs: RenderInputs): string | null {
  const inputValue = inputs[source];
  if (inputValue && typeof inputValue === "object" && inputValue.kind === "image") {
    return inputValue.url;
  }

  return null;
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

function toCanvasTextAlign(value: TextRenderNode["style"]["textAlign"]): CanvasTextAlign {
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

async function drawOverlayImage(
  ctx: CanvasRenderingContext2D,
  overlay: Extract<OverlayItem, { kind: "sticker" | "badge" }>,
  options?: RenderOptions,
) {
  const image = await loadImage(overlay.assetUrl);
  if (options?.shouldAbort?.()) {
    return;
  }
  ctx.save();
  ctx.translate(overlay.x + overlay.width / 2, overlay.y + overlay.height / 2);
  ctx.rotate((overlay.rotation * Math.PI) / 180);
  ctx.drawImage(image, -overlay.width / 2, -overlay.height / 2, overlay.width, overlay.height);
  ctx.restore();
}

function drawOverlayEmoji(
  ctx: CanvasRenderingContext2D,
  overlay: Extract<OverlayItem, { kind: "emoji" }>,
) {
  ctx.save();
  ctx.translate(overlay.x + overlay.width / 2, overlay.y + overlay.height / 2);
  ctx.rotate((overlay.rotation * Math.PI) / 180);
  ctx.font = `${Math.round(overlay.height * 0.84)}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(overlay.text || "🔥", 0, 0);
  ctx.restore();
}

function drawOverlaySpeechBubble(
  ctx: CanvasRenderingContext2D,
  overlay: Extract<OverlayItem, { kind: "speechBubble" }>,
) {
  ctx.save();
  ctx.translate(overlay.x + overlay.width / 2, overlay.y + overlay.height / 2);
  ctx.rotate((overlay.rotation * Math.PI) / 180);
  drawRoundedRect(ctx, -overlay.width / 2, -overlay.height / 2, overlay.width, overlay.height, 24);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#1f1712";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-overlay.width / 2 + 44, overlay.height / 2);
  ctx.lineTo(-overlay.width / 2 + 88, overlay.height / 2);
  ctx.lineTo(-overlay.width / 2 + 60, overlay.height / 2 + 28);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#1f1712";
  ctx.stroke();

  ctx.fillStyle = "#1f1712";
  ctx.font = `700 ${Math.max(18, Math.round(overlay.height * 0.2))}px Pretendard, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = wrapText(ctx, overlay.text || "Say something", overlay.width - 32, 3);
  const lineHeight = Math.max(18, Math.round(overlay.height * 0.2)) * 1.2;
  const startY = -((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    ctx.fillText(line, 0, startY + index * lineHeight, overlay.width - 28);
  });
  ctx.restore();
}

async function drawOverlays(ctx: CanvasRenderingContext2D, overlays: OverlayItem[], options?: RenderOptions) {
  for (const overlay of overlays) {
    if (options?.shouldAbort?.()) {
      return;
    }

    if (overlay.kind === "sticker" || overlay.kind === "badge") {
      await drawOverlayImage(ctx, overlay, options);
      continue;
    }

    if (overlay.kind === "emoji") {
      drawOverlayEmoji(ctx, overlay);
      continue;
    }

    if (overlay.kind === "speechBubble") {
      drawOverlaySpeechBubble(ctx, overlay);
    }
  }
}

function drawShape(ctx: CanvasRenderingContext2D, node: ShapeRenderNode) {
  const radius = typeof node.style.cornerRadius === "number" ? node.style.cornerRadius : 0;
  const width = node.width ?? 0;
  const height = node.height ?? 0;

  ctx.save();
  ctx.globalAlpha = node.opacity ?? 1;

  if (node.shape === "roundRect" || node.shape === "rect") {
    drawRoundedRect(ctx, node.x, node.y, width, height, node.shape === "roundRect" ? radius : 0);
  } else if (node.shape === "circle") {
    ctx.beginPath();
    ctx.arc(node.x + width / 2, node.y + width / 2, width / 2, 0, Math.PI * 2);
  } else if (node.shape === "ellipse") {
    ctx.beginPath();
    ctx.ellipse(node.x + width / 2, node.y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
  } else {
    ctx.restore();
    return;
  }

  if (node.style.fill) {
    ctx.fillStyle = node.style.fill;
    ctx.fill();
  }

  if (node.style.stroke) {
    ctx.strokeStyle = node.style.stroke.color;
    ctx.lineWidth = node.style.stroke.width ?? 1;
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
  node: TextRenderNode,
  inputs: RenderInputs,
) {
  const text = resolveTextValue(node, inputs);
  const fontWeight = node.style.fontWeight ?? "normal";
  const fontStyle = node.style.fontStyle ?? "normal";

  ctx.save();
  ctx.globalAlpha = node.opacity ?? 1;
  ctx.font = `${fontStyle} ${fontWeight} ${node.style.fontSize}px ${node.style.fontFamily}`;
  ctx.fillStyle = node.style.fill;
  ctx.textAlign = toCanvasTextAlign(node.style.textAlign);
  ctx.textBaseline = "top";

  if (node.style.stroke) {
    ctx.strokeStyle = node.style.stroke.color;
    ctx.lineWidth = node.style.stroke.width ?? 1;
  }

  const lines = wrapText(ctx, text, node.width, node.maxLines);
  const lineHeight = node.style.lineHeight
    ? node.style.fontSize * node.style.lineHeight
    : node.style.fontSize * 1.2;
  const drawX =
    node.style.textAlign === "center"
      ? node.x + node.width / 2
      : node.style.textAlign === "right"
        ? node.x + node.width
        : node.x;

  lines.forEach((line, index) => {
    const y = node.y + index * lineHeight;
    if (node.style.stroke) {
      ctx.strokeText(line, drawX, y, node.width);
    }
    ctx.fillText(line, drawX, y, node.width);
  });
  ctx.restore();
}

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  node: SpeechBubbleRenderNode,
  inputs: RenderInputs,
) {
  const radius = typeof node.style.cornerRadius === "number" ? node.style.cornerRadius : 24;
  const text = resolveTextValue(node, inputs);
  const tailWidth = node.tail?.size?.width ?? 32;
  const tailHeight = node.tail?.size?.height ?? 24;
  const tailX = node.x + 48;
  const tailY = node.y + node.height;

  ctx.save();
  ctx.globalAlpha = node.opacity ?? 1;
  drawRoundedRect(ctx, node.x, node.y, node.width, node.height, radius);
  if (node.style.fill) {
    ctx.fillStyle = node.style.fill;
    ctx.fill();
  }
  if (node.style.stroke) {
    ctx.strokeStyle = node.style.stroke.color;
    ctx.lineWidth = node.style.stroke.width ?? 1;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(tailX + tailWidth, tailY);
  ctx.lineTo(tailX + tailWidth / 2, tailY + tailHeight);
  ctx.closePath();
  if (node.style.fill) {
    ctx.fillStyle = node.style.fill;
    ctx.fill();
  }
  if (node.style.stroke) {
    ctx.strokeStyle = node.style.stroke.color;
    ctx.lineWidth = node.style.stroke.width ?? 1;
    ctx.stroke();
  }

  ctx.font = `${node.textStyle.fontWeight ?? "normal"} ${node.textStyle.fontSize}px ${node.textStyle.fontFamily}`;
  ctx.fillStyle = node.textStyle.fill;
  ctx.textAlign = node.textStyle.textAlign === "left" || node.textStyle.textAlign === "right"
    ? node.textStyle.textAlign
    : "center";
  ctx.textBaseline = "middle";
  const lines = wrapText(ctx, text, node.width - (node.padding ?? 16) * 2, 3);
  const lineHeight = node.textStyle.lineHeight
    ? node.textStyle.fontSize * node.textStyle.lineHeight
    : node.textStyle.fontSize * 1.2;
  const centerY = node.y + node.height / 2 - ((lines.length - 1) * lineHeight) / 2;
  const textX =
    node.textStyle.textAlign === "left"
      ? node.x + (node.padding ?? 16)
      : node.textStyle.textAlign === "right"
        ? node.x + node.width - (node.padding ?? 16)
        : node.x + node.width / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, textX, centerY + index * lineHeight, node.width - (node.padding ?? 16) * 2);
  });
  ctx.restore();
}

async function drawImageNode(
  ctx: CanvasRenderingContext2D,
  node: ImageRenderNode,
  inputs: RenderInputs,
  options?: RenderOptions,
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
    drawPlaceholderImage(ctx, node.x, node.y, node.width, node.height, node.placeholderLabel);
    ctx.restore();
    return;
  }

  const image = await loadImage(imageUrl);
  if (options?.shouldAbort?.()) {
    ctx.restore();
    return;
  }
  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;
  const angleInRadians = ((node.angle ?? 0) * Math.PI) / 180;

  ctx.translate(centerX, centerY);
  if (angleInRadians !== 0) {
    ctx.rotate(angleInRadians);
  }

  if (node.fit === "contain") {
    const scale = Math.min(node.width / image.width, node.height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
    return;
  }

  if (node.fit === "cover") {
    const scale = Math.max(node.width / image.width, node.height / image.height);
    const sourceWidth = node.width / scale;
    const sourceHeight = node.height / scale;
    const sourceX = Math.max(0, (image.width - sourceWidth) / 2);
    const sourceY = Math.max(0, (image.height - sourceHeight) / 2);

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      -node.width / 2,
      -node.height / 2,
      node.width,
      node.height,
    );
    ctx.restore();
    return;
  }

  ctx.drawImage(image, -node.width / 2, -node.height / 2, node.width, node.height);
  ctx.restore();
}

export async function renderPresetToCanvas(
  canvas: HTMLCanvasElement,
  renderModel: RenderModel,
  inputs: RenderInputs,
  overlays: OverlayItem[] = [],
  options?: RenderOptions,
) {
  canvas.width = renderModel.width;
  canvas.height = renderModel.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  ctx.clearRect(0, 0, renderModel.width, renderModel.height);
  ctx.fillStyle = renderModel.backgroundColor;
  ctx.fillRect(0, 0, renderModel.width, renderModel.height);

  for (const node of renderModel.nodes) {
    if (options?.shouldAbort?.()) {
      return;
    }

    if (!evaluateVisibleWhen(node.visibleWhen, inputs)) {
      continue;
    }

    if (node.kind === "shape") {
      drawShape(ctx, node);
      continue;
    }

    if (node.kind === "text") {
      if (node.source && options?.hiddenTextInputs?.includes(node.source)) {
        continue;
      }
      drawTextNode(ctx, node, inputs);
      continue;
    }

    if (node.kind === "speechBubble") {
      drawSpeechBubble(ctx, node, inputs);
      continue;
    }

    await drawImageNode(ctx, node, inputs, options);
  }

  await drawOverlays(ctx, overlays, options);
  applyAnalogVideoEffects(canvas, renderModel.effects);
}
