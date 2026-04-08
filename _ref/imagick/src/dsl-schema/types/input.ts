import type { AssetReference, Bounds, ColorValue, Expression } from "./primitives";

export type InputKind = "image" | "text" | "sticker" | "emoji" | "camera";

export interface BaseInputDefinition {
  name: string;
  type: InputKind;
  label?: string;
  description?: string;
  required?: boolean;
  defaultValue?: string;
  visibleWhen?: Expression;
}

export interface ImageInputDefinition extends BaseInputDefinition {
  type: "image";
  accept?: string[];
  multiple?: boolean;
  maxFileSizeMb?: number;
  aspectRatio?: number;
}

export interface TextInputDefinition extends BaseInputDefinition {
  type: "text";
  maxLength?: number;
  minLength?: number;
  multiline?: boolean;
  placeholder?: string;
  textColor?: ColorValue;
}

export interface StickerOption {
  id: string;
  label: string;
  asset: AssetReference;
  tags?: string[];
}

export interface StickerInputDefinition extends BaseInputDefinition {
  type: "sticker";
  maxCount?: number;
  options: StickerOption[];
  safeArea?: Bounds;
}

export interface EmojiInputDefinition extends BaseInputDefinition {
  type: "emoji";
  maxCount?: number;
  allowed?: string[];
  safeArea?: Bounds;
}

export interface CameraConstraintSet {
  facingMode?: "user" | "environment";
  width?: number;
  height?: number;
  deviceId?: string;
}

export interface CameraInputDefinition extends BaseInputDefinition {
  type: "camera";
  captureLabel?: string;
  constraints?: CameraConstraintSet;
}

export type InputDefinition =
  | ImageInputDefinition
  | TextInputDefinition
  | StickerInputDefinition
  | EmojiInputDefinition
  | CameraInputDefinition;
