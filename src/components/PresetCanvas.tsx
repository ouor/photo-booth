import { useEffect, useRef, useState } from "react";
import type { PresetDocument } from "../dsl-schema";
import type { RenderInputs } from "../lib/preset-engine";
import { renderPresetToCanvas } from "../lib/preset-engine";

interface PresetCanvasProps {
  preset: PresetDocument;
  inputs: RenderInputs;
}

export function PresetCanvas({ preset, inputs }: PresetCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    void renderPresetToCanvas(canvas, preset, inputs);
  }, [preset, inputs]);

  return (
    <div className="preview-card">
      <div className="preview-surface">
        <canvas ref={canvasRef} className="preview-canvas" />
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
