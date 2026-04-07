import { useEffect, useRef } from "react";
import type { PresetDocument } from "../dsl-schema";
import type { RenderInputs } from "../lib/preset-engine";
import { renderPresetToCanvas } from "../lib/preset-engine";

interface PresetCanvasProps {
  preset: PresetDocument;
  inputs: RenderInputs;
}

export function PresetCanvas({ preset, inputs }: PresetCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
        <span>
          {preset.output.width} x {preset.output.height}
        </span>
      </div>
    </div>
  );
}
