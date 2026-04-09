import type { BlendMode, FitMode, ShapeStyle, TailStyle, TextStyle } from "../../dsl-schema";

export interface PresetMetadataModel {
  id: string;
  name: string;
  version: string;
  description?: string;
  tags: string[];
}

export interface ShapeRenderNode {
  kind: "shape";
  id?: string;
  zIndex: number;
  visibleWhen?: string;
  shape: "rect" | "roundRect" | "circle" | "ellipse" | "polygon" | "path";
  x: number;
  y: number;
  width: number;
  height: number;
  points?: { x: number; y: number }[];
  pathData?: string;
  angle?: number;
  opacity?: number;
  style: ShapeStyle;
}

export interface ImageRenderNode {
  kind: "image";
  id?: string;
  zIndex: number;
  visibleWhen?: string;
  source: string;
  placeholderLabel: string;
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

export interface TextRenderNode {
  kind: "text";
  id?: string;
  zIndex: number;
  visibleWhen?: string;
  source?: string;
  placeholderLabel?: string;
  text?: string;
  x: number;
  y: number;
  width: number;
  maxLines?: number;
  ellipsis?: boolean;
  angle?: number;
  opacity?: number;
  style: TextStyle;
}

export interface SpeechBubbleRenderNode {
  kind: "speechBubble";
  id?: string;
  zIndex: number;
  visibleWhen?: string;
  source?: string;
  placeholderLabel?: string;
  text?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  padding?: number;
  opacity?: number;
  style: ShapeStyle;
  textStyle: TextStyle;
  tail?: TailStyle;
}

export type RenderNode =
  | ShapeRenderNode
  | ImageRenderNode
  | TextRenderNode
  | SpeechBubbleRenderNode;

export interface RenderModel {
  width: number;
  height: number;
  format: "image/png" | "image/jpeg" | "image/webp";
  backgroundColor: string;
  nodes: RenderNode[];
  effects: AnalogVideoEffectNode[];
}

export interface AnalogVideoEffectNode {
  kind: "analogVideo";
  preset: "ntsc-clean" | "vhs-home-video" | "vhs-damaged-tape";
  intensity: number;
}

export interface EditorImageSlot {
  inputName: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EditorTextSlot {
  inputName: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  maxLines?: number;
  style: TextStyle;
  appearanceScope: "preset" | "adaptive";
}

export interface EditorModel {
  imageSlots: EditorImageSlot[];
  textSlots: EditorTextSlot[];
}

export interface ExportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExportModel {
  bounds: ExportBounds;
  format: "image/png" | "image/jpeg" | "image/webp";
}

export interface CompiledPreset {
  metadata: PresetMetadataModel;
  renderModel: RenderModel;
  editorModel: EditorModel;
}

export interface AppliedFilterConfig {
  type:
    | "brightness"
    | "contrast"
    | "saturation"
    | "grayscale"
    | "blur"
    | "sepia"
    | "invert";
  amount?: number;
  mode?: string;
  enabled?: boolean;
}

export interface ImageNodeMutation {
  maskRadius?: number;
  opacity?: number;
  filter?: string;
  blendMode?: BlendMode;
}
