import { useMemo, useState } from "react";
import type { RenderImageValue } from "../lib/preset-engine";
import { useEditorSession } from "../lib/editor-session";
import { exportPresetImage } from "../lib/export";
import {
  overlayAssetLibrary,
  type OverlayAssetOption,
  type OverlayItem,
} from "../lib/overlay-editor";
import { compileExportModel, compilePreset } from "../lib/preset-compiler";
import { presetLibrary } from "../lib/preset-library";

function shouldAutoCloseMenuOnMobile() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(max-width: 760px)").matches;
}

export function usePresetEditor() {
  const [selectedPresetId, setSelectedPresetId] = useState(presetLibrary[0]?.id ?? "");

  const selectedPreset = useMemo(
    () => presetLibrary.find((entry) => entry.id === selectedPresetId)?.preset,
    [selectedPresetId],
  );
  const {
    session,
    setMenuOpen,
    setRenderInput,
    addOverlay,
    removeOverlay,
    updateOverlay,
    setSelectedOverlayId,
    setActiveImageSlot,
  } = useEditorSession(selectedPreset?.inputs ?? []);

  const compiledPreset = useMemo(
    () => (selectedPreset ? compilePreset(selectedPreset) : null),
    [selectedPreset],
  );

  const exportModel = useMemo(
    () =>
      compiledPreset
        ? compileExportModel(compiledPreset.renderModel, compiledPreset.editorModel, session.overlays)
        : null,
    [compiledPreset, session.overlays],
  );

  const activeImageLabel =
    compiledPreset?.editorModel.imageSlots.find((slot) => slot.inputName === session.activeImageSlot)
      ?.label ?? "Image";

  const activeImageValue = session.activeImageSlot
    ? session.renderInputs[session.activeImageSlot]
    : null;

  return {
    presetLibrary,
    overlayAssetLibrary,
    selectedPresetId,
    setSelectedPresetId,
    compiledPreset,
    session,
    activeImageLabel,
    activeImageValue,
    toggleMenu: () => setMenuOpen(!session.menuOpen),
    closeMenu: () => setMenuOpen(false),
    openImageSlot: (slotName: string) => setActiveImageSlot(slotName),
    closeImageSource: () => setActiveImageSlot(null),
    clearActiveImage: () => {
      if (!session.activeImageSlot) {
        return;
      }

      setRenderInput(session.activeImageSlot, null);
    },
    setActiveImageFromUrl: (url: string) => {
      if (!session.activeImageSlot) {
        return;
      }

      const imageValue: RenderImageValue = {
        kind: "image",
        url,
      };
      setRenderInput(session.activeImageSlot, imageValue);
    },
    addOverlayAsset: (asset: OverlayAssetOption) => {
      addOverlay(asset);
      if (shouldAutoCloseMenuOnMobile()) {
        setMenuOpen(false);
      }
    },
    removeOverlay,
    updateOverlay,
    selectOverlay: (id: string | null) => setSelectedOverlayId(id),
    moveOverlay: (id: string, x: number, y: number) =>
      updateOverlay(id, (overlay: OverlayItem) => ({ ...overlay, x, y })),
    updateTextInput: (name: string, value: string) => setRenderInput(name, value),
    saveImage: async () => {
      if (!compiledPreset || !exportModel) {
        return;
      }

      await exportPresetImage({
        renderModel: compiledPreset.renderModel,
        exportModel,
        inputs: session.renderInputs,
        overlays: session.overlays,
        filename: `${compiledPreset.metadata.id}.png`,
      });
    },
  };
}
