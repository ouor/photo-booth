export type HexColor = `#${string}`;

export type ColorValue = HexColor | "transparent" | string;

export type AssetReference = string;

export type InputReference = string;

export type Expression = string;

export interface Point2D {
  x: number;
  y: number;
}

export interface Size2D {
  width: number;
  height: number;
}

export interface Bounds extends Point2D, Size2D {}

export interface ShadowStyle {
  color?: ColorValue;
  blur?: number;
  offsetX?: number;
  offsetY?: number;
}

export interface StrokeStyle {
  color: ColorValue;
  width?: number;
  lineJoin?: "miter" | "round" | "bevel";
  lineCap?: "butt" | "round" | "square";
}

export interface PaddingBox {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface VisibilityRule {
  when: Expression;
}

export interface RenderControl {
  id?: string;
  zIndex?: number;
  opacity?: number;
  visible?: boolean;
  visibleWhen?: Expression;
  editable?: boolean;
  movable?: boolean;
  resizable?: boolean;
  rotatable?: boolean;
  locked?: boolean;
}
