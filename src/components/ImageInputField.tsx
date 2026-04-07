import { useEffect, useRef, useState } from "react";
import type { ImageInputDefinition } from "../dsl-schema";
import type { RenderImageValue } from "../lib/preset-engine";

interface ImageInputFieldProps {
  input: ImageInputDefinition;
  value: RenderImageValue | null | undefined;
  onChange: (value: RenderImageValue | null) => void;
}

function toImageValue(url: string): RenderImageValue {
  return {
    kind: "image",
    url,
  };
}

export function ImageInputField({ input, value, onChange }: ImageInputFieldProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!cameraOpen) {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      return;
    }

    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraError(null);
      } catch (error) {
        setCameraError(error instanceof Error ? error.message : "Camera unavailable");
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [cameraOpen]);

  return (
    <div className="image-field-stack">
      <input
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) {
            onChange(null);
            return;
          }

          onChange(toImageValue(URL.createObjectURL(file)));
        }}
      />
      <div className="inline-actions">
        <button
          type="button"
          className="ghost-button"
          onClick={() => setCameraOpen((current) => !current)}
        >
          {cameraOpen ? "Close camera" : "Use camera"}
        </button>
        {value ? (
          <small>Image ready</small>
        ) : (
          <small>{input.aspectRatio ? `Aspect ${input.aspectRatio}:1` : "No image selected"}</small>
        )}
      </div>

      {cameraOpen ? (
        <div className="camera-panel">
          <video ref={videoRef} muted playsInline className="camera-video" />
          <canvas ref={canvasRef} hidden />
          <div className="inline-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                if (!video || !canvas) {
                  return;
                }

                const width = video.videoWidth || 1080;
                const height = video.videoHeight || 1440;
                canvas.width = width;
                canvas.height = height;

                const context = canvas.getContext("2d");
                if (!context) {
                  return;
                }

                context.drawImage(video, 0, 0, width, height);
                onChange(toImageValue(canvas.toDataURL("image/png")));
                setCameraOpen(false);
              }}
            >
              Capture frame
            </button>
            <button type="button" className="ghost-button" onClick={() => setCameraOpen(false)}>
              Cancel
            </button>
          </div>
          {cameraError ? <small>{cameraError}</small> : null}
        </div>
      ) : null}
    </div>
  );
}
