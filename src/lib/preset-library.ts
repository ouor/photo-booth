import type { PresetDocument } from "../dsl-schema";
import { assertPresetDocument } from "./preset-validation";

import fourCutPresetData from "../presets/four-cut/preset.json";
import memeBubblePresetData from "../presets/meme-bubble/preset.json";
import photocardPresetData from "../presets/photocard/preset.json";
import polaroidPresetData from "../presets/polaroid/preset.json";

export interface PresetSummary {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  dimensions: string;
  preset: PresetDocument;
}

const presetDocuments = [
  polaroidPresetData,
  fourCutPresetData,
  photocardPresetData,
  memeBubblePresetData,
].map((entry) => assertPresetDocument(entry));

export const presetLibrary: PresetSummary[] = presetDocuments.map((preset) => ({
  id: preset.metadata.id,
  name: preset.metadata.name,
  description: preset.metadata.description,
  tags: preset.metadata.tags ?? [],
  dimensions: `${preset.output.width}x${preset.output.height}`,
  preset,
}));

export function getPresetById(id: string): PresetDocument | undefined {
  return presetLibrary.find((entry) => entry.id === id)?.preset;
}
