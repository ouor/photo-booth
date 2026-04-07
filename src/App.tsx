import { useEffect, useMemo, useState } from "react";
import "./App.css";
import menuHamburgerIcon from "./assets/menu-hamburger.svg";
import { ImageSourceOverlay } from "./components/ImageSourceOverlay";
import { OverlayToolbar } from "./components/OverlayToolbar";
import { PresetCanvas } from "./components/PresetCanvas";
import type { RenderInputs } from "./lib/preset-engine";
import {
  createOverlayItem,
  overlayAssetLibrary,
  type OverlayItem,
} from "./lib/overlay-editor";
import { compileExportModel, compilePreset } from "./lib/preset-compiler";
import { presetLibrary } from "./lib/preset-library";

function App() {
  const [selectedPresetId, setSelectedPresetId] = useState(presetLibrary[0]?.id ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const [renderInputs, setRenderInputs] = useState<RenderInputs>({});
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [activeImageSlot, setActiveImageSlot] = useState<string | null>(null);

  const selectedPreset = useMemo(
    () => presetLibrary.find((entry) => entry.id === selectedPresetId)?.preset,
    [selectedPresetId],
  );

  const compiledPreset = useMemo(
    () => (selectedPreset ? compilePreset(selectedPreset) : null),
    [selectedPreset],
  );

  const exportModel = useMemo(
    () =>
      compiledPreset
        ? compileExportModel(compiledPreset.renderModel, compiledPreset.editorModel, overlays)
        : null,
    [compiledPreset, overlays],
  );

  useEffect(() => {
    if (!selectedPreset) {
      return;
    }

    const nextValues: RenderInputs = {};
    selectedPreset.inputs.forEach((input) => {
      nextValues[input.name] = input.defaultValue ?? "";
    });
    setRenderInputs(nextValues);
    setOverlays([]);
    setSelectedOverlayId(null);
    setActiveImageSlot(null);
    setMenuOpen(false);
  }, [selectedPreset]);

  const activeImageLabel =
    compiledPreset?.editorModel.imageSlots.find((slot) => slot.inputName === activeImageSlot)?.label ??
    "Image";
  const activeImageValue = activeImageSlot ? renderInputs[activeImageSlot] : null;

  return (
    <main className="app-shell cinematic">
      <button
        type="button"
        className="icon-button menu-trigger"
        onClick={() => setMenuOpen((current) => !current)}
        aria-label="Open editor menu"
      >
        <img src={menuHamburgerIcon} alt="" aria-hidden="true" className="menu-trigger-icon" />
      </button>

      <section className="canvas-only-layout">
        {compiledPreset && exportModel ? (
          <PresetCanvas
            metadata={compiledPreset.metadata}
            renderModel={compiledPreset.renderModel}
            editorModel={compiledPreset.editorModel}
            exportModel={exportModel}
            inputs={renderInputs}
            overlays={overlays}
            selectedOverlayId={selectedOverlayId}
            onOverlaySelect={setSelectedOverlayId}
            onOverlayMove={(id, x, y) =>
              setOverlays((current) =>
                current.map((overlay) => (overlay.id === id ? { ...overlay, x, y } : overlay)),
              )
            }
            onTextChange={(name, value) =>
              setRenderInputs((current) => ({
                ...current,
                [name]: value,
              }))
            }
            onImageSlotOpen={setActiveImageSlot}
          />
        ) : null}
      </section>

      <aside className={menuOpen ? "side-menu open" : "side-menu"}>
        <div className="side-menu-inner">
          <div className="side-menu-head">
            <div>
              <p className="menu-kicker">Imagick Studio</p>
              <h2>Preset Menu</h2>
            </div>
            <button type="button" className="icon-button ghost" onClick={() => setMenuOpen(false)} aria-label="Close menu">
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
                  onClick={() => setSelectedPresetId(entry.id)}
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
            assets={overlayAssetLibrary}
            onAdd={(asset) => {
              const overlay = createOverlayItem(asset);
              setOverlays((current) => [...current, overlay]);
              setSelectedOverlayId(overlay.id);
            }}
            onRemove={(id) => {
              setOverlays((current) => current.filter((overlay) => overlay.id !== id));
              setSelectedOverlayId((current) => (current === id ? null : current));
            }}
            onSelect={setSelectedOverlayId}
            onChange={(id, updater) =>
              setOverlays((current) =>
                current.map((overlay) => (overlay.id === id ? updater(overlay) : overlay)),
              )
            }
          />
        </div>
      </aside>

      <ImageSourceOverlay
        open={activeImageSlot !== null}
        label={activeImageLabel}
        hasValue={typeof activeImageValue === "object" && activeImageValue?.kind === "image"}
        onClose={() => setActiveImageSlot(null)}
        onClear={() => {
          if (!activeImageSlot) {
            return;
          }

          setRenderInputs((current) => ({
            ...current,
            [activeImageSlot]: null,
          }));
        }}
        onImageSelected={(dataUrl) => {
          if (!activeImageSlot) {
            return;
          }

          setRenderInputs((current) => ({
            ...current,
            [activeImageSlot]: {
              kind: "image",
              url: dataUrl,
            },
          }));
        }}
      />
    </main>
  );
}

export default App;
