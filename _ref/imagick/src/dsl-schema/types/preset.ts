import type { Command } from "./commands";
import type { InputDefinition } from "./input";
import type { AssetReference } from "./primitives";

export interface PresetMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  tags?: string[];
  thumbnail?: AssetReference;
  preview?: AssetReference;
}

export interface PresetOutput {
  width: number;
  height: number;
  format: "image/png" | "image/jpeg" | "image/webp";
  backgroundColor?: string;
}

export interface PresetDocument {
  schemaVersion: string;
  metadata: PresetMetadata;
  inputs: InputDefinition[];
  output: PresetOutput;
  commands: Command[];
}
