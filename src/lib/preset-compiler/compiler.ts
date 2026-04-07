import type { InputDefinition, PresetDocument } from "../../dsl-schema";
import type { OverlayItem } from "../overlay-editor";
import type {
  CompiledPreset,
  EditorModel,
  EditorTextSlot,
  ExportBounds,
  ExportModel,
  ImageRenderNode,
  RenderModel,
  RenderNode,
  TextRenderNode,
} from "./models";

function estimateTextHeight(node: Pick<TextRenderNode, "maxLines" | "style">): number {
  const fontSize = node.style.fontSize;
  const lineHeight = node.style.lineHeight ?? 1.2;
  const maxLines = node.maxLines ?? 1;
  return Math.ceil(fontSize * lineHeight * maxLines + 12);
}

function resolveTextAppearanceScope(node: TextRenderNode): "preset" | "adaptive" {
  if (node.style.stroke || node.style.backgroundColor) {
    return "preset";
  }

  return "adaptive";
}

function compileRenderModel(preset: PresetDocument): RenderModel {
  const inputByName = new Map<string, InputDefinition>(
    preset.inputs.map((input) => [input.name, input]),
  );
  const nodes: RenderNode[] = [];
  const imageNodes = new Map<string, ImageRenderNode>();

  let width = preset.output.width;
  let height = preset.output.height;
  let backgroundColor = preset.output.backgroundColor ?? "#ffffff";

  preset.commands.forEach((command, index) => {
    const zIndex = command.zIndex ?? index;

    switch (command.op) {
      case "createCanvas":
        width = command.width;
        height = command.height;
        backgroundColor = command.backgroundColor ?? backgroundColor;
        break;
      case "drawShape":
        nodes.push({
          kind: "shape",
          id: command.id,
          zIndex,
          visibleWhen: command.visibleWhen,
          shape: command.shape,
          x: command.x,
          y: command.y,
          width: command.width ?? 0,
          height: command.height ?? 0,
          points: command.points,
          pathData: command.pathData,
          angle: command.angle,
          opacity: command.opacity,
          style: command.style,
        });
        break;
      case "placeImage": {
        const input = inputByName.get(command.source);
        const node: ImageRenderNode = {
          kind: "image",
          id: command.id,
          zIndex,
          visibleWhen: command.visibleWhen,
          source: command.source,
          placeholderLabel: input?.label ?? command.source,
          x: command.x,
          y: command.y,
          width: command.width,
          height: command.height,
          fit: command.fit ?? "cover",
          angle: command.angle,
          opacity: command.opacity,
        };
        nodes.push(node);
        if (command.id) {
          imageNodes.set(command.id, node);
        }
        break;
      }
      case "maskImage": {
        const target = imageNodes.get(command.target);
        if (target && command.shape === "roundRect") {
          target.maskRadius = command.radius ?? 0;
        }
        break;
      }
      case "applyFilter": {
        const target = imageNodes.get(command.target);
        if (target) {
          target.filter = command.filters
            .map((entry) => {
              switch (entry.type) {
                case "brightness":
                  return `brightness(${1 + (entry.amount ?? 0)})`;
                case "contrast":
                  return `contrast(${1 + (entry.amount ?? 0)})`;
                case "blur":
                  return `blur(${Math.max(0, entry.amount ?? 0)}px)`;
                case "grayscale":
                  return "grayscale(1)";
                case "sepia":
                  return `sepia(${Math.max(0, entry.amount ?? 1)})`;
                case "invert":
                  return entry.enabled ? "invert(1)" : "";
                case "saturation":
                  return `saturate(${1 + (entry.amount ?? 0)})`;
                default:
                  return "";
              }
            })
            .filter(Boolean)
            .join(" ");
        }
        break;
      }
      case "drawText": {
        const input = command.source ? inputByName.get(command.source) : undefined;
        nodes.push({
          kind: "text",
          id: command.id,
          zIndex,
          visibleWhen: command.visibleWhen,
          source: command.source,
          placeholderLabel: input?.label ?? command.source,
          text: command.text,
          x: command.x,
          y: command.y,
          width: command.width,
          maxLines: command.maxLines,
          ellipsis: command.ellipsis,
          angle: command.angle,
          opacity: command.opacity,
          style: command.style,
        });
        break;
      }
      case "drawSpeechBubble": {
        const input = command.source ? inputByName.get(command.source) : undefined;
        nodes.push({
          kind: "speechBubble",
          id: command.id,
          zIndex,
          visibleWhen: command.visibleWhen,
          source: command.source,
          placeholderLabel: input?.label ?? command.source,
          text: command.text,
          x: command.x,
          y: command.y,
          width: command.width,
          height: command.height,
          padding: command.padding,
          opacity: command.opacity,
          style: command.style,
          textStyle: command.textStyle,
          tail: command.tail,
        });
        break;
      }
      case "drawFrame":
      case "drawSticker":
      case "captureCamera":
      case "defineInput":
      case "cropImage":
      case "transform":
      case "setOpacity":
      case "setBlendMode":
      case "group":
      case "repeat":
      case "conditional":
      case "exportImage":
        break;
      default:
        break;
    }
  });

  nodes.sort((a, b) => a.zIndex - b.zIndex);

  return {
    width,
    height,
    format: preset.output.format,
    backgroundColor,
    nodes,
  };
}

function compileEditorModel(renderModel: RenderModel): EditorModel {
  const imageSlots = renderModel.nodes
    .filter((node): node is ImageRenderNode => node.kind === "image")
    .map((node) => ({
      inputName: node.source,
      label: node.placeholderLabel,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
    }));

  const textSlots: EditorTextSlot[] = renderModel.nodes
    .filter((node): node is TextRenderNode => node.kind === "text" && Boolean(node.source))
    .map((node) => ({
      inputName: node.source!,
      label: node.placeholderLabel ?? node.source!,
      x: node.x,
      y: node.y,
      width: node.width,
      height: estimateTextHeight(node),
      maxLines: node.maxLines,
      style: node.style,
      appearanceScope: resolveTextAppearanceScope(node),
    }));

  return {
    imageSlots,
    textSlots,
  };
}

function getRenderNodeBounds(node: RenderNode, textSlots: EditorTextSlot[]): ExportBounds {
  switch (node.kind) {
    case "shape":
    case "image":
    case "speechBubble":
      return { x: node.x, y: node.y, width: node.width, height: node.height };
    case "text": {
      const matchingSlot = node.source
        ? textSlots.find((slot) => slot.inputName === node.source)
        : undefined;
      return {
        x: node.x,
        y: node.y,
        width: node.width,
        height: matchingSlot?.height ?? estimateTextHeight(node),
      };
    }
  }
}

function getOverlayBounds(overlay: OverlayItem): ExportBounds {
  return { x: overlay.x, y: overlay.y, width: overlay.width, height: overlay.height };
}

export function compilePreset(preset: PresetDocument): CompiledPreset {
  const renderModel = compileRenderModel(preset);
  const editorModel = compileEditorModel(renderModel);

  return {
    metadata: {
      id: preset.metadata.id,
      name: preset.metadata.name,
      version: preset.metadata.version,
      description: preset.metadata.description,
      tags: preset.metadata.tags ?? [],
    },
    renderModel,
    editorModel,
  };
}

export function compileExportModel(
  renderModel: RenderModel,
  editorModel: EditorModel,
  overlays: OverlayItem[],
): ExportModel {
  const allBounds = [
    ...renderModel.nodes.map((node) => getRenderNodeBounds(node, editorModel.textSlots)),
    ...overlays.map(getOverlayBounds),
  ];

  if (allBounds.length === 0) {
    return {
      format: renderModel.format,
      bounds: { x: 0, y: 0, width: renderModel.width, height: renderModel.height },
    };
  }

  const minX = Math.max(0, Math.min(...allBounds.map((bounds) => bounds.x)));
  const minY = Math.max(0, Math.min(...allBounds.map((bounds) => bounds.y)));
  const maxX = Math.min(
    renderModel.width,
    Math.max(...allBounds.map((bounds) => bounds.x + bounds.width)),
  );
  const maxY = Math.min(
    renderModel.height,
    Math.max(...allBounds.map((bounds) => bounds.y + bounds.height)),
  );

  return {
    format: renderModel.format,
    bounds: {
      x: Math.floor(minX),
      y: Math.floor(minY),
      width: Math.ceil(maxX - minX),
      height: Math.ceil(maxY - minY),
    },
  };
}
