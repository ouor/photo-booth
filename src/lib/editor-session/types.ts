import type { RenderInputs } from "../preset-engine";
import type { OverlayItem } from "../overlay-editor";

export interface EditorSessionState {
  menuOpen: boolean;
  renderInputs: RenderInputs;
  overlays: OverlayItem[];
  selectedOverlayId: string | null;
  activeImageSlot: string | null;
}
