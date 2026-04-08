import type { OverlayAssetOption, OverlayItem } from "../lib/overlay-editor";
import type { PresetSummary } from "../lib/preset-library";
import { OverlayToolbar } from "./OverlayToolbar";

interface EditorSidebarProps {
  open: boolean;
  presetLibrary: PresetSummary[];
  selectedPresetId: string;
  overlays: OverlayItem[];
  selectedOverlayId: string | null;
  assets: OverlayAssetOption[];
  onClose: () => void;
  onPresetSelect: (presetId: string) => void;
  onOverlayAdd: (asset: OverlayAssetOption) => void;
  onOverlayRemove: (id: string) => void;
  onOverlaySelect: (id: string) => void;
  onOverlayChange: (id: string, updater: (current: OverlayItem) => OverlayItem) => void;
}

export function EditorSidebar({
  open,
  presetLibrary,
  selectedPresetId,
  overlays,
  selectedOverlayId,
  assets,
  onClose,
  onPresetSelect,
  onOverlayAdd,
  onOverlayRemove,
  onOverlaySelect,
  onOverlayChange,
}: EditorSidebarProps) {
  return (
    <aside
      className={open ? "side-menu open" : "side-menu"}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="side-menu-inner">
        <div className="side-menu-head">
          <div>
            <p className="menu-kicker">Imagick Studio</p>
            <h2>Preset Menu</h2>
          </div>
          <button type="button" className="icon-button ghost" onClick={onClose} aria-label="Close menu">
            x
          </button>
        </div>

        <section className="menu-section">
          <div className="menu-section-head">
            <h3>Presets</h3>
            <span>{presetLibrary.length}</span>
          </div>
          <div className="preset-picker-list">
            {presetLibrary.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={entry.id === selectedPresetId ? "preset-chip active" : "preset-chip"}
                onClick={() => onPresetSelect(entry.id)}
              >
                <strong>{entry.name}</strong>
                <span>{entry.dimensions}</span>
              </button>
            ))}
          </div>
        </section>

        <OverlayToolbar
          overlays={overlays}
          selectedOverlayId={selectedOverlayId}
          assets={assets}
          onAdd={onOverlayAdd}
          onRemove={onOverlayRemove}
          onSelect={onOverlaySelect}
          onChange={onOverlayChange}
        />
      </div>
    </aside>
  );
}
