import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { PresetDocument } from "../dsl-schema";
import type { RenderInputs } from "../lib/preset-engine";
import { renderPresetToCanvas } from "../lib/preset-engine";
import { findOverlayAtPoint, type OverlayItem } from "../lib/overlay-editor";
import { deriveExportBounds, type PresetEditorModel } from "../lib/preset-editor-model";

interface PresetCanvasProps {
  preset: PresetDocument;
  inputs: RenderInputs;
  editorModel: PresetEditorModel;
  overlays: OverlayItem[];
  selectedOverlayId: string | null;
  onOverlaySelect: (id: string | null) => void;
  onOverlayMove: (id: string, x: number, y: number) => void;
  onTextChange: (name: string, value: string) => void;
  onImageSlotOpen: (name: string) => void;
}

export function PresetCanvas({
  preset,
  inputs,
  editorModel,
  overlays,
  selectedOverlayId,
  onOverlaySelect,
  onOverlayMove,
  onTextChange,
  onImageSlotOpen,
}: PresetCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragStateRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const renderCycleRef = useRef(0);
  const [status, setStatus] = useState("");
  const [activeTextInput, setActiveTextInput] = useState<string | null>(null);
  const [displaySize, setDisplaySize] = useState({
    width: preset.output.width,
    height: preset.output.height,
  });
  const [textContrastMap, setTextContrastMap] = useState<Record<string, { color: string; textShadow: string }>>({});

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) {
      return;
    }
    const targetCanvas: HTMLCanvasElement = canvasElement;

    const currentCycle = renderCycleRef.current + 1;
    renderCycleRef.current = currentCycle;
    async function renderAndSample() {
      await renderPresetToCanvas(targetCanvas, preset, inputs, overlays, {
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

      const context = targetCanvas.getContext("2d");
      if (!context) {
        return;
      }

      const nextContrastMap: Record<string, { color: string; textShadow: string }> = {};

      editorModel.textSlots.forEach((slot) => {
        if (slot.appearanceScope === "preset") {
          nextContrastMap[slot.inputName] = {
            color: slot.style.fill,
            textShadow: "none",
          };
          return;
        }

        const sampleX = Math.max(0, Math.floor(slot.x));
        const sampleY = Math.max(0, Math.floor(slot.y));
        const sampleWidth = Math.max(1, Math.min(targetCanvas.width - sampleX, Math.floor(slot.width)));
        const sampleHeight = Math.max(1, Math.min(targetCanvas.height - sampleY, Math.floor(slot.height)));

        try {
          const { data } = context.getImageData(sampleX, sampleY, sampleWidth, sampleHeight);
          let totalLuminance = 0;
          const pixelCount = data.length / 4;

          for (let index = 0; index < data.length; index += 4) {
            const red = data[index] / 255;
            const green = data[index + 1] / 255;
            const blue = data[index + 2] / 255;
            totalLuminance += 0.2126 * red + 0.7152 * green + 0.0722 * blue;
          }

          const averageLuminance = pixelCount > 0 ? totalLuminance / pixelCount : 1;
          const useDarkText = averageLuminance > 0.62;

          nextContrastMap[slot.inputName] = useDarkText
            ? {
                color: "#171717",
                textShadow: "0 1px 2px rgba(255,255,255,0.35)",
              }
            : {
                color: "#fffdf8",
                textShadow: "0 1px 3px rgba(0,0,0,0.45)",
              };
        } catch {
          nextContrastMap[slot.inputName] = {
            color: "#fffdf8",
            textShadow: "0 1px 3px rgba(0,0,0,0.45)",
          };
        }
      });

      setTextContrastMap(nextContrastMap);
    }

    void renderAndSample();
  }, [activeTextInput, editorModel.textSlots, inputs, overlays, preset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      setDisplaySize({
        width: canvas.clientWidth || preset.output.width,
        height: canvas.clientHeight || preset.output.height,
      });
    });

    observer.observe(canvas);
    setDisplaySize({
      width: canvas.clientWidth || preset.output.width,
      height: canvas.clientHeight || preset.output.height,
    });

    return () => observer.disconnect();
  }, [preset.output.height, preset.output.width]);

  const scaleX = displaySize.width / preset.output.width;
  const scaleY = displaySize.height / preset.output.height;

  function getCanvasPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const mappedScaleX = canvas.width / rect.width;
    const mappedScaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * mappedScaleX,
      y: (event.clientY - rect.top) * mappedScaleY,
    };
  }

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
        contrast: textContrastMap[slot.inputName] ?? {
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
              : textContrastMap[slot.inputName]?.color ?? slot.style.fill,
          textShadow:
            slot.appearanceScope === "preset" && activeTextInput !== slot.inputName
              ? "transparent"
              : textContrastMap[slot.inputName]?.textShadow ?? "none",
          WebkitTextFillColor:
            slot.appearanceScope === "preset" && activeTextInput !== slot.inputName
              ? "transparent"
              : undefined,
          caretColor: slot.appearanceScope === "preset" ? slot.style.fill : undefined,
          textAlign: slot.style.textAlign === "right" ? "right" : slot.style.textAlign === "center" ? "center" : "left",
          lineHeight: String(slot.style.lineHeight ?? 1.2),
        } satisfies CSSProperties,
      })),
    [activeTextInput, editorModel.textSlots, scaleX, scaleY, textContrastMap],
  );

  const exportBounds = useMemo(
    () => deriveExportBounds(preset, editorModel, overlays),
    [editorModel, overlays, preset],
  );

  return (
    <section className="editor-stage">
      <div className="preview-card">
        <div className="preview-surface">
          <div className="canvas-stack" style={{ width: displaySize.width, height: displaySize.height }}>
            <canvas
              ref={canvasRef}
              className={selectedOverlayId ? "preview-canvas interactive" : "preview-canvas"}
              onPointerDown={(event) => {
                const point = getCanvasPoint(event);
                if (!point) {
                  return;
                }

                const overlay = findOverlayAtPoint(overlays, point.x, point.y);
                if (!overlay) {
                  onOverlaySelect(null);
                  dragStateRef.current = null;
                  return;
                }

                onOverlaySelect(overlay.id);
                dragStateRef.current = {
                  id: overlay.id,
                  offsetX: point.x - overlay.x,
                  offsetY: point.y - overlay.y,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const point = getCanvasPoint(event);
                const dragState = dragStateRef.current;
                if (!point || !dragState) {
                  return;
                }

                onOverlayMove(
                  dragState.id,
                  Math.max(0, point.x - dragState.offsetX),
                  Math.max(0, point.y - dragState.offsetY),
                );
              }}
              onPointerUp={(event) => {
                dragStateRef.current = null;
                event.currentTarget.releasePointerCapture(event.pointerId);
              }}
            />

            <div className="interaction-layer">
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
                    onFocus={() => setActiveTextInput(slot.inputName)}
                    onBlur={() => setActiveTextInput((current) => (current === slot.inputName ? null : current))}
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
                    onFocus={() => setActiveTextInput(slot.inputName)}
                    onBlur={() => setActiveTextInput((current) => (current === slot.inputName ? null : current))}
                    onChange={(event) => onTextChange(slot.inputName, event.target.value)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="preview-meta floating">
          <strong>{preset.metadata.name}</strong>
          <div className="preview-actions">
            <button
              type="button"
              className="primary-button"
              onClick={async () => {
                const canvas = canvasRef.current;
                if (!canvas) {
                  return;
                }

                const exportCanvas = document.createElement("canvas");
                await renderPresetToCanvas(exportCanvas, preset, inputs, overlays);

                const croppedCanvas = document.createElement("canvas");
                croppedCanvas.width = exportBounds.width;
                croppedCanvas.height = exportBounds.height;

                const croppedContext = croppedCanvas.getContext("2d");
                if (!croppedContext) {
                  setStatus("Export failed");
                  return;
                }

                croppedContext.drawImage(
                  exportCanvas,
                  exportBounds.x,
                  exportBounds.y,
                  exportBounds.width,
                  exportBounds.height,
                  0,
                  0,
                  exportBounds.width,
                  exportBounds.height,
                );

                croppedCanvas.toBlob((blob) => {
                  if (!blob) {
                    setStatus("Export failed");
                    return;
                  }

                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `${preset.metadata.id}.png`;
                  link.click();
                  URL.revokeObjectURL(url);
                  setStatus("PNG downloaded");
                }, preset.output.format);
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
