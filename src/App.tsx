import { useMemo } from "react";
import "./App.css";
import menuHamburgerIcon from "./assets/menu-hamburger.svg";
import { ImageSourceOverlay } from "./components/ImageSourceOverlay";
import { OverlayToolbar } from "./components/OverlayToolbar";
import { PresetCanvas } from "./components/PresetCanvas";
import {
  overlayAssetLibrary,
} from "./lib/overlay-editor";
import { useEditorSession } from "./lib/editor-session";
import { exportPresetImage } from "./lib/export";
import { compileExportModel, compilePreset } from "./lib/preset-compiler";
import { presetLibrary } from "./lib/preset-library";
import { useState } from "react";

function shouldAutoCloseMenuOnMobile() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(max-width: 760px)").matches;
}

function App() {
  const [selectedPresetId, setSelectedPresetId] = useState(presetLibrary[0]?.id ?? "");

  const selectedPreset = useMemo(
    () => presetLibrary.find((entry) => entry.id === selectedPresetId)?.preset,
    [selectedPresetId],
  );
  const { session, setMenuOpen, setRenderInput, addOverlay, removeOverlay, updateOverlay, setSelectedOverlayId, setActiveImageSlot } =
    useEditorSession(selectedPreset?.inputs ?? []);

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
    compiledPreset?.editorModel.imageSlots.find((slot) => slot.inputName === session.activeImageSlot)?.label ??
    "Image";
  const activeImageValue = session.activeImageSlot ? session.renderInputs[session.activeImageSlot] : null;

  return (
    <main className="app-shell cinematic">
      <button
        type="button"
        className="icon-button menu-trigger"
        onClick={() => setMenuOpen(!session.menuOpen)}
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
            inputs={session.renderInputs}
            overlays={session.overlays}
            selectedOverlayId={session.selectedOverlayId}
            onOverlaySelect={setSelectedOverlayId}
            onOverlayMove={(id, x, y) => updateOverlay(id, (overlay) => ({ ...overlay, x, y }))}
            onTextChange={setRenderInput}
            onImageSlotOpen={setActiveImageSlot}
            onSaveImage={() =>
              exportPresetImage({
                renderModel: compiledPreset.renderModel,
                exportModel,
                inputs: session.renderInputs,
                overlays: session.overlays,
                filename: `${compiledPreset.metadata.id}.png`,
              })
            }
          />
        ) : null}
      </section>

      <aside
        className={session.menuOpen ? "side-menu open" : "side-menu"}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setMenuOpen(false);
          }
        }}
      >
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
            overlays={session.overlays}
            selectedOverlayId={session.selectedOverlayId}
            assets={overlayAssetLibrary}
            onAdd={(asset) => {
              addOverlay(asset);
              if (shouldAutoCloseMenuOnMobile()) {
                setMenuOpen(false);
              }
            }}
            onRemove={removeOverlay}
            onSelect={setSelectedOverlayId}
            onChange={updateOverlay}
          />
        </div>
      </aside>

      <ImageSourceOverlay
        open={session.activeImageSlot !== null}
        label={activeImageLabel}
        hasValue={typeof activeImageValue === "object" && activeImageValue?.kind === "image"}
        onClose={() => setActiveImageSlot(null)}
        onClear={() => {
          if (!session.activeImageSlot) {
            return;
          }

          setRenderInput(session.activeImageSlot, null);
        }}
        onImageSelected={(dataUrl) => {
          if (!session.activeImageSlot) {
            return;
          }

          setRenderInput(session.activeImageSlot, {
            kind: "image",
            url: dataUrl,
          });
        }}
      />
    </main>
  );
}

export default App;
