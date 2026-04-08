import type { ColorValue, PaddingBox, Point2D, StrokeStyle } from "./primitives";

export type BlendMode =
  | "source-over"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten";

export type FitMode = "cover" | "contain" | "stretch";

export type Origin = "left" | "center" | "right" | "top" | "bottom";

export interface CornerRadii {
  topLeft?: number;
  topRight?: number;
  bottomRight?: number;
  bottomLeft?: number;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight?: number | "normal" | "bold";
  fontStyle?: "normal" | "italic" | "oblique";
  fill: ColorValue;
  stroke?: StrokeStyle;
  textAlign?: "left" | "center" | "right" | "justify";
  lineHeight?: number;
  charSpacing?: number;
  backgroundColor?: ColorValue;
  padding?: number | PaddingBox;
}

export interface ShapeStyle {
  fill?: ColorValue;
  stroke?: StrokeStyle;
  cornerRadius?: number | CornerRadii;
}

export interface TailStyle {
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "right"
    | "bottom-right"
    | "bottom-center"
    | "bottom-left"
    | "left";
  anchor?: Point2D;
  size?: {
    width: number;
    height: number;
  };
}
