import { useEffect, useMemo, useState } from "react";
import type { InputDefinition } from "../../dsl-schema";
import type { OverlayAssetOption, OverlayItem } from "../overlay-editor";
import { createOverlayItem } from "../overlay-editor";
import type { EditorSessionState } from "./types";

function buildInitialInputs(inputs: InputDefinition[]) {
  return inputs.reduce<EditorSessionState["renderInputs"]>((acc, input) => {
    acc[input.name] = input.defaultValue ?? "";
    return acc;
  }, {});
}

export function useEditorSession(inputs: InputDefinition[]) {
  const initialInputs = useMemo(() => buildInitialInputs(inputs), [inputs]);

  const [session, setSession] = useState<EditorSessionState>({
    menuOpen: false,
    renderInputs: initialInputs,
    overlays: [],
    selectedOverlayId: null,
    activeImageSlot: null,
  });

  useEffect(() => {
    setSession({
      menuOpen: false,
      renderInputs: initialInputs,
      overlays: [],
      selectedOverlayId: null,
      activeImageSlot: null,
    });
  }, [initialInputs]);

  return {
    session,
    setMenuOpen: (value: boolean) =>
      setSession((current) => ({
        ...current,
        menuOpen: value,
      })),
    setRenderInput: (name: string, value: EditorSessionState["renderInputs"][string]) =>
      setSession((current) => ({
        ...current,
        renderInputs: {
          ...current.renderInputs,
          [name]: value,
        },
      })),
    addOverlay: (asset: OverlayAssetOption) =>
      setSession((current) => {
        const overlay = createOverlayItem(asset);
        return {
          ...current,
          overlays: [...current.overlays, overlay],
          selectedOverlayId: overlay.id,
        };
      }),
    removeOverlay: (id: string) =>
      setSession((current) => ({
        ...current,
        overlays: current.overlays.filter((overlay) => overlay.id !== id),
        selectedOverlayId: current.selectedOverlayId === id ? null : current.selectedOverlayId,
      })),
    updateOverlay: (id: string, updater: (current: OverlayItem) => OverlayItem) =>
      setSession((current) => ({
        ...current,
        overlays: current.overlays.map((overlay) => (overlay.id === id ? updater(overlay) : overlay)),
      })),
    setSelectedOverlayId: (id: string | null) =>
      setSession((current) => ({
        ...current,
        selectedOverlayId: id,
      })),
    setActiveImageSlot: (slot: string | null) =>
      setSession((current) => ({
        ...current,
        activeImageSlot: slot,
      })),
  };
}
