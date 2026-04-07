import type { OverlayAssetOption, OverlayItem } from "../lib/overlay-editor";

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

  return (
    <section className="overlay-panel">
      <div className="section-heading">
        <h2>Free Overlay Layer</h2>
        <span>{overlays.length} items</span>
      </div>

      <div className="overlay-asset-grid">
        {assets.map((asset) => (
          <button
            key={asset.id}
            type="button"
            className="overlay-asset-card"
            onClick={() => onAdd(asset)}
          >
            <strong>{asset.label}</strong>
            <span>{asset.kind}</span>
          </button>
        ))}
      </div>

      <div className="overlay-list">
        {overlays.length === 0 ? <p className="empty-copy">Add stickers, badges, speech bubbles, or emojis here.</p> : null}
        {overlays.map((overlay, index) => (
          <button
            key={overlay.id}
            type="button"
            className={overlay.id === selectedOverlayId ? "overlay-row active" : "overlay-row"}
            onClick={() => onSelect(overlay.id)}
          >
            <strong>{index + 1}. {overlay.kind}</strong>
            <span>{Math.round(overlay.x)}, {Math.round(overlay.y)}</span>
          </button>
        ))}
      </div>

      {selectedOverlay ? (
        <div className="overlay-inspector">
          <div className="field-head">
            <strong>Selected Overlay</strong>
            <button type="button" className="ghost-button" onClick={() => onRemove(selectedOverlay.id)}>
              Remove
            </button>
          </div>

          <label className="field-card compact">
            <span>X Position</span>
            <input
              type="range"
              min="0"
              max="1080"
              value={selectedOverlay.x}
              onChange={(event) =>
                onChange(selectedOverlay.id, (current) => ({ ...current, x: Number(event.target.value) }))
              }
            />
          </label>

          <label className="field-card compact">
            <span>Y Position</span>
            <input
              type="range"
              min="0"
              max="1920"
              value={selectedOverlay.y}
              onChange={(event) =>
                onChange(selectedOverlay.id, (current) => ({ ...current, y: Number(event.target.value) }))
              }
            />
          </label>

          <label className="field-card compact">
            <span>Size</span>
            <input
              type="range"
              min="48"
              max="420"
              value={selectedOverlay.kind === "speechBubble" ? selectedOverlay.width : selectedOverlay.width}
              onChange={(event) =>
                onChange(selectedOverlay.id, (current) => {
                  const next = Number(event.target.value);
                  if (current.kind === "speechBubble") {
                    return { ...current, width: next, height: Math.round(next * 0.58) };
                  }
                  return { ...current, width: next, height: next };
                })
              }
            />
          </label>

          <label className="field-card compact">
            <span>Rotation</span>
            <input
              type="range"
              min="-45"
              max="45"
              value={selectedOverlay.rotation}
              onChange={(event) =>
                onChange(selectedOverlay.id, (current) => ({ ...current, rotation: Number(event.target.value) }))
              }
            />
          </label>

          {selectedOverlay.kind === "emoji" || selectedOverlay.kind === "speechBubble" ? (
            <label className="field-card compact">
              <span>Text</span>
              <input
                type="text"
                value={selectedOverlay.text}
                onChange={(event) =>
                  onChange(selectedOverlay.id, (current) =>
                    current.kind === "emoji" || current.kind === "speechBubble"
                      ? { ...current, text: event.target.value }
                      : current,
                  )
                }
              />
            </label>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
