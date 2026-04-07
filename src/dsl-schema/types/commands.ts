import type { BlendMode, FitMode, ShapeStyle, TailStyle, TextStyle } from "./style";
import type {
  AssetReference,
  Bounds,
  ColorValue,
  InputReference,
  Point2D,
  RenderControl,
} from "./primitives";

export interface BaseCommand extends RenderControl {
  op: string;
}

export interface CreateCanvasCommand extends BaseCommand {
  op: "createCanvas";
  width: number;
  height: number;
  backgroundColor?: ColorValue;
  backgroundImage?: AssetReference;
  pixelRatio?: number;
}

export interface DefineInputCommand extends BaseCommand {
  op: "defineInput";
  input: InputReference;
}

export interface CaptureCameraCommand extends BaseCommand {
  op: "captureCamera";
  input: InputReference;
  video:
    | boolean
    | {
        facingMode?: "user" | "environment";
        width?: number;
        height?: number;
        deviceId?: string;
      };
  audio?: boolean;
}

export interface PlaceImageCommand extends BaseCommand {
  op: "placeImage";
  source: AssetReference | InputReference;
  target?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fit?: FitMode;
  angle?: number;
  originX?: "left" | "center" | "right";
  originY?: "top" | "center" | "bottom";
  shadow?: {
    color?: ColorValue;
    blur?: number;
    offsetX?: number;
    offsetY?: number;
  };
}

export interface CropImageCommand extends BaseCommand {
  op: "cropImage";
  source: AssetReference | InputReference;
  target?: string;
  targetAspectRatio?: number;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  mode?: "manual" | "auto-center" | "face-priority";
  minWidth?: number;
  minHeight?: number;
}

export interface MaskImageCommand extends BaseCommand {
  op: "maskImage";
  target: string;
  shape: "rect" | "roundRect" | "circle" | "ellipse" | "path" | "assetMask";
  radius?: number;
  pathData?: string;
  maskSource?: AssetReference;
  absolutePositioned?: boolean;
}

export interface DrawFrameCommand extends BaseCommand {
  op: "drawFrame";
  source: AssetReference;
  x: number;
  y: number;
  width: number;
  height: number;
  blendMode?: BlendMode;
}

export interface DrawTextCommand extends BaseCommand {
  op: "drawText";
  source?: InputReference;
  text?: string;
  x: number;
  y: number;
  width: number;
  maxLines?: number;
  ellipsis?: boolean;
  angle?: number;
  style: TextStyle;
}

export interface DrawStickerCommand extends BaseCommand {
  op: "drawSticker";
  source: AssetReference | InputReference;
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
  tint?: ColorValue;
  maxCount?: number;
}

export interface DrawShapeCommand extends BaseCommand {
  op: "drawShape";
  shape: "rect" | "roundRect" | "circle" | "ellipse" | "polygon" | "path";
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: Point2D[];
  pathData?: string;
  angle?: number;
  style: ShapeStyle;
}

export interface DrawSpeechBubbleCommand extends BaseCommand {
  op: "drawSpeechBubble";
  text?: string;
  source?: InputReference;
  x: number;
  y: number;
  width: number;
  height: number;
  padding?: number;
  style: ShapeStyle;
  textStyle: TextStyle;
  tail?: TailStyle;
}

export interface TransformCommand extends BaseCommand {
  op: "transform";
  target: string;
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  flipX?: boolean;
  flipY?: boolean;
  skewX?: number;
  skewY?: number;
}

export interface FilterDefinition {
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

export interface ApplyFilterCommand extends BaseCommand {
  op: "applyFilter";
  target: string;
  filters: FilterDefinition[];
}

export interface SetOpacityCommand extends BaseCommand {
  op: "setOpacity";
  target: string;
  opacity: number;
}

export interface SetBlendModeCommand extends BaseCommand {
  op: "setBlendMode";
  target: string;
  blendMode: BlendMode;
}

export interface GroupCommand extends BaseCommand {
  op: "group";
  groupId: string;
  targets: string[];
  clipBounds?: Bounds;
}

export interface RepeatBinding {
  index: number;
  input?: InputReference;
  asset?: AssetReference;
}

export interface RepeatCommand extends BaseCommand {
  op: "repeat";
  count: number;
  offsetX?: number;
  offsetY?: number;
  gap?: number;
  bindings?: RepeatBinding[];
  template: Command[];
}

export interface ConditionalCommand extends BaseCommand {
  op: "conditional";
  if: string;
  then: Command[];
  else?: Command[];
}

export interface ExportImageCommand extends BaseCommand {
  op: "exportImage";
  format: "image/png" | "image/jpeg" | "image/webp";
  quality?: number;
  multiplier?: number;
  filename?: string;
  backgroundColor?: ColorValue;
}

export type Command =
  | CreateCanvasCommand
  | DefineInputCommand
  | CaptureCameraCommand
  | PlaceImageCommand
  | CropImageCommand
  | MaskImageCommand
  | DrawFrameCommand
  | DrawTextCommand
  | DrawStickerCommand
  | DrawShapeCommand
  | DrawSpeechBubbleCommand
  | TransformCommand
  | ApplyFilterCommand
  | SetOpacityCommand
  | SetBlendModeCommand
  | GroupCommand
  | RepeatCommand
  | ConditionalCommand
  | ExportImageCommand;
