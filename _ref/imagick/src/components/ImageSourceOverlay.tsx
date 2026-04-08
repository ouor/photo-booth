import { useEffect, useRef, useState } from "react";

interface ImageSourceOverlayProps {
  open: boolean;
  label: string;
  hasValue: boolean;
  onClose: () => void;
  onImageSelected: (dataUrl: string) => void;
  onClear: () => void;
}

type OverlayMode = "chooser" | "camera";
type CameraFacingMode = "user" | "environment";

export function ImageSourceOverlay({
  open,
  label,
  hasValue,
  onClose,
  onImageSelected,
  onClear,
}: ImageSourceOverlayProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mode, setMode] = useState<OverlayMode>("chooser");
  const [cameraFacingMode, setCameraFacingMode] = useState<CameraFacingMode>("environment");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!open || mode !== "camera") {
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
          video: { facingMode: cameraFacingMode },
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
        setStatus(
          cameraFacingMode === "user"
            ? "Front camera live. Tap again to capture."
            : "Rear camera live. Tap again to capture.",
        );
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Camera unavailable.");
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [cameraFacingMode, open, mode]);

  useEffect(() => {
    if (!open) {
      setMode("chooser");
      setCameraFacingMode("environment");
      setStatus("");
    }
  }, [open]);

  async function readFromClipboard() {
    if (!navigator.clipboard?.read) {
      setStatus("Clipboard image read is not supported here.");
      return;
    }

    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith("image/"));
        if (!imageType) {
          continue;
        }

        const blob = await item.getType(imageType);
        onImageSelected(URL.createObjectURL(blob));
        onClose();
        return;
      }

      setStatus("No image found in the clipboard.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Clipboard read failed.");
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="glass-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="glass-card">
        <div className="glass-head">
          <div>
            <p className="glass-kicker">Image Slot</p>
            <h3>{label}</h3>
          </div>
          <button type="button" className="icon-button ghost" onClick={onClose} aria-label="Close">
            x
          </button>
        </div>

        {mode === "chooser" ? (
          <div className="glass-actions">
            <button type="button" className="glass-action" onClick={() => fileInputRef.current?.click()}>
              <strong>Choose Photo</strong>
              <span>Import from your device</span>
            </button>
            <button type="button" className="glass-action" onClick={() => setMode("camera")}>
              <strong>Open Camera</strong>
              <span>Preview live and tap again to capture</span>
            </button>
            <button type="button" className="glass-action" onClick={() => void readFromClipboard()}>
              <strong>Read Clipboard</strong>
              <span>Pull the latest copied image</span>
            </button>
            {hasValue ? (
              <button
                type="button"
                className="glass-action subtle"
                onClick={() => {
                  onClear();
                  onClose();
                }}
              >
                <strong>Clear Image</strong>
                <span>Remove the current photo from this frame</span>
              </button>
            ) : null}
          </div>
        ) : (
          <div className="camera-capture-panel">
            <button
              type="button"
              className="camera-stage"
              onClick={() => {
                const video = videoRef.current;
                const canvas = captureCanvasRef.current;
                if (!video || !canvas) {
                  return;
                }

                const width = video.videoWidth || 1280;
                const height = video.videoHeight || 960;
                canvas.width = width;
                canvas.height = height;

                const context = canvas.getContext("2d");
                if (!context) {
                  return;
                }

                context.drawImage(video, 0, 0, width, height);
                onImageSelected(canvas.toDataURL("image/png"));
                onClose();
              }}
            >
              <video ref={videoRef} muted playsInline className="camera-stage-video" />
              <span>Tap the live camera view to capture</span>
            </button>
            <canvas ref={captureCanvasRef} hidden />
            <div className="inline-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  setCameraFacingMode((current) =>
                    current === "environment" ? "user" : "environment",
                  )
                }
              >
                {cameraFacingMode === "environment"
                  ? "Switch to front camera"
                  : "Switch to rear camera"}
              </button>
              <button type="button" className="ghost-button" onClick={() => setMode("chooser")}>
                Back
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }

            onImageSelected(URL.createObjectURL(file));
            onClose();
          }}
        />

        {status ? <p className="glass-status">{status}</p> : null}
      </div>
    </div>
  );
}
