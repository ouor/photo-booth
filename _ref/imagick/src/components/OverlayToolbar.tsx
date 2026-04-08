import type { OverlayAssetOption, OverlayItem } from "../lib/overlay-editor";
import {
  applyOverlayInspectorValue,
  getOverlayAssetMeta,
  getOverlayInspectorControls,
  getOverlayListMeta,
} from "../lib/overlay-presenter";

interface OverlayToolbarProps {
  overlays: OverlayItem[];
  selectedOverlayId: string | null;
  assets: OverlayAssetOption[];
  onAdd: (asset: OverlayAssetOption) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  onChange: (id: string, updater: (current: OverlayItem) => OverlayItem) => void;
}

export function OverlayToolbar({
  overlays,
  selectedOverlayId,
  assets,
  onAdd,
  onRemove,
  onSelect,
  onChange,
}: OverlayToolbarProps) {
  const selectedOverlay = overlays.find((overlay) => overlay.id === selectedOverlayId) ?? null;
  const inspectorControls = selectedOverlay ? getOverlayInspectorControls(selectedOverlay) : [];

  return (
    <section className="overlay-panel">
      <div className="section-heading">
        <h2>Free Overlay Layer</h2>
        <span>{overlays.length} items</span>
      </div>

      <div className="overlay-asset-grid">
        {assets.map((asset) => {
          const meta = getOverlayAssetMeta(asset);
          return (
            <button
              key={asset.id}
              type="button"
              className="overlay-asset-card"
              onClick={() => onAdd(asset)}
            >
              <strong>{meta.title}</strong>
              <span>{meta.subtitle}</span>
            </button>
          );
        })}
      </div>

      <div className="overlay-list">
        {overlays.length === 0 ? <p className="empty-copy">Add stickers, badges, speech bubbles, or emojis here.</p> : null}
        {overlays.map((overlay, index) => {
          const meta = getOverlayListMeta(overlay, index);
          return (
            <button
              key={overlay.id}
              type="button"
              className={overlay.id === selectedOverlayId ? "overlay-row active" : "overlay-row"}
              onClick={() => onSelect(overlay.id)}
            >
              <strong>{meta.title}</strong>
              <span>{meta.subtitle}</span>
            </button>
          );
        })}
      </div>

      {selectedOverlay ? (
        <div className="overlay-inspector">
          <div className="field-head">
            <strong>Selected Overlay</strong>
            <button type="button" className="ghost-button" onClick={() => onRemove(selectedOverlay.id)}>
              Remove
            </button>
          </div>

          {inspectorControls.map((control) => (
            <label key={control.key} className="field-card compact">
              <span>{control.label}</span>
              {control.type === "range" ? (
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  value={control.value}
                  onChange={(event) =>
                    onChange(selectedOverlay.id, (current) =>
                      applyOverlayInspectorValue(current, control.key, Number(event.target.value)),
                    )
                  }
                />
              ) : (
                <input
                  type="text"
                  value={control.value}
                  onChange={(event) =>
                    onChange(selectedOverlay.id, (current) =>
                      applyOverlayInspectorValue(current, control.key, event.target.value),
                    )
                  }
                />
              )}
            </label>
          ))}
        </div>
      ) : null}
    </section>
  );
}
