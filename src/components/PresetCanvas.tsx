import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { PresetDocument } from "../dsl-schema";
import type { RenderInputs } from "../lib/preset-engine";
import { renderPresetToCanvas } from "../lib/preset-engine";
import { findOverlayAtPoint, type OverlayItem } from "../lib/overlay-editor";

interface PresetCanvasProps {
  preset: PresetDocument;
  inputs: RenderInputs;
  overlays: OverlayItem[];
  selectedOverlayId: string | null;
  onOverlaySelect: (id: string | null) => void;
  onOverlayMove: (id: string, x: number, y: number) => void;
}

export function PresetCanvas({
  preset,
  inputs,
  overlays,
  selectedOverlayId,
  onOverlaySelect,
  onOverlayMove,
}: PresetCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragStateRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const renderCycleRef = useRef(0);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const currentCycle = renderCycleRef.current + 1;
    renderCycleRef.current = currentCycle;

    void renderPresetToCanvas(canvas, preset, inputs, overlays, {
      shouldAbort: () => renderCycleRef.current !== currentCycle,
    });
  }, [preset, inputs, overlays]);

  function getCanvasPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  return (
    <div className="preview-card">
      <div className="preview-surface">
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
      </div>
      <div className="preview-meta">
        <strong>{preset.metadata.name}</strong>
        <div className="preview-actions">
          <span>
            {preset.output.width} x {preset.output.height}
          </span>
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              const canvas = canvasRef.current;
              if (!canvas) {
                return;
              }

              canvas.toBlob((blob) => {
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
            Download PNG
          </button>
        </div>
      </div>
      {status ? <small className="export-status">{status}</small> : null}
    </div>
  );
}
