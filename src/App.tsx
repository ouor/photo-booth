import "./App.css";
import menuHamburgerIcon from "./assets/menu-hamburger.svg";
import { EditorSidebar } from "./components/EditorSidebar";
import { ImageSourceOverlay } from "./components/ImageSourceOverlay";
import { PresetCanvas } from "./components/PresetCanvas";
import { usePresetEditor } from "./hooks/usePresetEditor";

function App() {
  const editor = usePresetEditor();

  return (
    <main className="app-shell cinematic">
      <button
        type="button"
        className="icon-button menu-trigger"
        onClick={editor.toggleMenu}
        aria-label="Open editor menu"
      >
        <img src={menuHamburgerIcon} alt="" aria-hidden="true" className="menu-trigger-icon" />
      </button>

      <section className="canvas-only-layout">
        {editor.compiledPreset ? (
          <PresetCanvas
            metadata={editor.compiledPreset.metadata}
            renderModel={editor.compiledPreset.renderModel}
            editorModel={editor.compiledPreset.editorModel}
            inputs={editor.session.renderInputs}
            overlays={editor.session.overlays}
            selectedOverlayId={editor.session.selectedOverlayId}
            onOverlaySelect={editor.selectOverlay}
            onOverlayMove={editor.moveOverlay}
            onTextChange={editor.updateTextInput}
            onImageSlotOpen={editor.openImageSlot}
            onSaveImage={editor.saveImage}
          />
        ) : null}
      </section>

      <EditorSidebar
        open={editor.session.menuOpen}
        presetLibrary={editor.presetLibrary}
        selectedPresetId={editor.selectedPresetId}
        overlays={editor.session.overlays}
        selectedOverlayId={editor.session.selectedOverlayId}
        assets={editor.overlayAssetLibrary}
        onClose={editor.closeMenu}
        onPresetSelect={editor.setSelectedPresetId}
        onOverlayAdd={editor.addOverlayAsset}
        onOverlayRemove={editor.removeOverlay}
        onOverlaySelect={(id) => editor.selectOverlay(id)}
        onOverlayChange={editor.updateOverlay}
      />

      <ImageSourceOverlay
        open={editor.session.activeImageSlot !== null}
        label={editor.activeImageLabel}
        hasValue={typeof editor.activeImageValue === "object" && editor.activeImageValue?.kind === "image"}
        onClose={editor.closeImageSource}
        onClear={editor.clearActiveImage}
        onImageSelected={editor.setActiveImageFromUrl}
      />
    </main>
  );
}

export default App;
