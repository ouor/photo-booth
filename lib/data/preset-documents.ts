import type { PresetDocument } from "@/dsl-schema";
import { getPresetById, presetLibrary } from "@/lib/preset-library";

const editorPresetMap: Record<string, string> = {
  "cherry-blossom": "polaroid-classic",
  "retro-film": "vhs-memory",
  "summer-vacation": "four-cut-classic",
  "diary-scrap": "photocard-soft",
  "polaroid-grid": "polaroid-classic",
  "gradient-pop": "meme-bubble-classic",
};

export function getEditorPresetDocument(appPresetId: string): PresetDocument | undefined {
  const documentId = editorPresetMap[appPresetId] ?? appPresetId;
  return getPresetById(documentId);
}

export function getAvailableEditorPresetSummaries() {
  return presetLibrary;
}
