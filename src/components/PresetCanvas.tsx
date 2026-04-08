import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { RenderInputs } from "../lib/preset-engine";
import { renderPresetToCanvas } from "../lib/preset-engine";
import type { OverlayItem } from "../lib/overlay-editor";
import { useOverlayInteraction, useTextEditingState } from "../lib/editor-interactions";
import { sampleTextAppearanceMap, type TextAppearanceMap } from "../lib/presentation";
import type { EditorModel, PresetMetadataModel, RenderModel } from "../lib/preset-compiler";

interface PresetCanvasProps {
  metadata: PresetMetadataModel;
  renderModel: RenderModel;
  editorModel: EditorModel;
  inputs: RenderInputs;
  overlays: OverlayItem[];
  selectedOverlayId: string | null;
  onOverlaySelect: (id: string | null) => void;
  onOverlayMove: (id: string, x: number, y: number) => void;
  onTextChange: (name: string, value: string) => void;
  onImageSlotOpen: (name: string) => void;
  onSaveImage: () => Promise<void>;
}

export function PresetCanvas({
  metadata,
  renderModel,
  editorModel,
  inputs,
  overlays,
  selectedOverlayId,
  onOverlaySelect,
  onOverlayMove,
  onTextChange,
  onImageSlotOpen,
  onSaveImage,
}: PresetCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderCycleRef = useRef(0);
  const [status, setStatus] = useState("");
  const [displaySize, setDisplaySize] = useState({
    width: renderModel.width,
    height: renderModel.height,
  });
  const [textAppearanceMap, setTextAppearanceMap] = useState<TextAppearanceMap>({});
  const { activeTextInput, focusTextInput, blurTextInput } = useTextEditingState();
  const overlayInteraction = useOverlayInteraction({
    canvasRef,
    overlays,
    onOverlayMove,
    onOverlaySelect,
  });

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) {
      return;
    }
    const targetCanvas: HTMLCanvasElement = canvasElement;

    const currentCycle = renderCycleRef.current + 1;
    renderCycleRef.current = currentCycle;
    async function renderAndSample() {
      await renderPresetToCanvas(targetCanvas, renderModel, inputs, overlays, {
        shouldAbort: () => renderCycleRef.current !== currentCycle,
        hiddenTextInputs: editorModel.textSlots
          .filter(
            (slot) =>
              slot.appearanceScope === "adaptive" || slot.inputName === activeTextInput,
          )
          .map((slot) => slot.inputName),
      });
      if (renderCycleRef.current !== currentCycle) {
        return;
      }
      setTextAppearanceMap(sampleTextAppearanceMap(targetCanvas, editorModel));
    }

    void renderAndSample();
  }, [activeTextInput, editorModel.textSlots, inputs, overlays, renderModel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      setDisplaySize({
        width: canvas.clientWidth || renderModel.width,
        height: canvas.clientHeight || renderModel.height,
      });
    });

    observer.observe(canvas);
    setDisplaySize({
      width: canvas.clientWidth || renderModel.width,
      height: canvas.clientHeight || renderModel.height,
    });

    return () => observer.disconnect();
  }, [renderModel.height, renderModel.width]);

  const scaleX = displaySize.width / renderModel.width;
  const scaleY = displaySize.height / renderModel.height;

  const imageSlotStyles = useMemo(
    () =>
      editorModel.imageSlots.map((slot) => ({
        slot,
        style: {
          left: `${slot.x * scaleX}px`,
          top: `${slot.y * scaleY}px`,
          width: `${slot.width * scaleX}px`,
          height: `${slot.height * scaleY}px`,
        } satisfies CSSProperties,
      })),
    [editorModel.imageSlots, scaleX, scaleY],
  );

  const textSlotStyles = useMemo(
    () =>
      editorModel.textSlots.map((slot) => ({
        slot,
        contrast: textAppearanceMap[slot.inputName] ?? {
          color: slot.style.fill,
          textShadow: "none",
        },
        style: {
          left: `${slot.x * scaleX}px`,
          top: `${slot.y * scaleY}px`,
          width: `${slot.width * scaleX}px`,
          minHeight: `${slot.height * scaleY}px`,
          fontFamily: slot.style.fontFamily,
          fontSize: `${slot.style.fontSize * scaleY}px`,
          fontWeight: slot.style.fontWeight,
          fontStyle: slot.style.fontStyle,
          color:
            slot.appearanceScope === "preset" && activeTextInput !== slot.inputName
              ? "transparent"
              : textAppearanceMap[slot.inputName]?.color ?? slot.style.fill,
          textShadow:
            slot.appearanceScope === "preset" && activeTextInput !== slot.inputName
              ? "transparent"
              : textAppearanceMap[slot.inputName]?.textShadow ?? "none",
          WebkitTextFillColor:
            slot.appearanceScope === "preset" && activeTextInput !== slot.inputName
              ? "transparent"
              : undefined,
          caretColor: slot.appearanceScope === "preset" ? slot.style.fill : undefined,
          textAlign: slot.style.textAlign === "right" ? "right" : slot.style.textAlign === "center" ? "center" : "left",
          lineHeight: String(slot.style.lineHeight ?? 1.2),
        } satisfies CSSProperties,
      })),
    [activeTextInput, editorModel.textSlots, scaleX, scaleY, textAppearanceMap],
  );

  return (
    <section className="editor-stage">
      <div className="preview-card">
        <div className="preview-surface">
          <div className="canvas-stack" style={{ width: displaySize.width, height: displaySize.height }}>
            <canvas
              ref={canvasRef}
              className={selectedOverlayId ? "preview-canvas interactive" : "preview-canvas"}
            />

            <div
              className="interaction-layer"
              onPointerDownCapture={overlayInteraction.onPointerDownCapture}
              onPointerMoveCapture={overlayInteraction.onPointerMoveCapture}
              onPointerUpCapture={overlayInteraction.onPointerUpCapture}
              onPointerCancelCapture={overlayInteraction.onPointerCancelCapture}
            >
              {imageSlotStyles.map(({ slot, style }) => {
                const currentValue = inputs[slot.inputName];
                const hasImage = typeof currentValue === "object" && currentValue?.kind === "image";

                return (
                  <button
                    key={slot.inputName}
                    type="button"
                    className={hasImage ? "image-slot-button has-image" : "image-slot-button empty"}
                    style={style}
                    onClick={() => onImageSlotOpen(slot.inputName)}
                    aria-label={`${slot.label} image slot`}
                  >
                    <span className={hasImage ? "slot-chip hover-only" : "slot-chip"}>
                      {hasImage ? "Replace photo" : `Add ${slot.label}`}
                    </span>
                  </button>
                );
              })}

              {textSlotStyles.map(({ slot, style, contrast }) => {
                const currentValue = inputs[slot.inputName];
                const textValue = typeof currentValue === "string" ? currentValue : "";

                return slot.maxLines && slot.maxLines > 1 ? (
                  <textarea
                    key={slot.inputName}
                    className="frame-text-input"
                    data-placeholder-tone={contrast.color === "#171717" ? "dark" : "light"}
                    data-appearance-scope={slot.appearanceScope}
                    style={style}
                    rows={slot.maxLines}
                    value={textValue}
                    placeholder={slot.label}
                    onFocus={() => focusTextInput(slot.inputName)}
                    onBlur={() => blurTextInput(slot.inputName)}
                    onChange={(event) => onTextChange(slot.inputName, event.target.value)}
                  />
                ) : (
                  <input
                    key={slot.inputName}
                    className="frame-text-input"
                    data-placeholder-tone={contrast.color === "#171717" ? "dark" : "light"}
                    data-appearance-scope={slot.appearanceScope}
                    style={style}
                    type="text"
                    value={textValue}
                    placeholder={slot.label}
                    onFocus={() => focusTextInput(slot.inputName)}
                    onBlur={() => blurTextInput(slot.inputName)}
                    onChange={(event) => onTextChange(slot.inputName, event.target.value)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="preview-meta floating">
          <strong>{metadata.name}</strong>
          <div className="preview-actions">
            <button
              type="button"
              className="primary-button"
              onClick={async () => {
                try {
                  await onSaveImage();
                  setStatus("PNG downloaded");
                } catch {
                  setStatus("Export failed");
                }
              }}
            >
              Save Image
            </button>
          </div>
        </div>
        {status ? <small className="export-status">{status}</small> : null}
      </div>
    </section>
  );
}
