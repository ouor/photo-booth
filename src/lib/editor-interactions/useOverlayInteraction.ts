import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { findOverlayAtPoint, type OverlayItem } from "../overlay-editor";

interface UseOverlayInteractionOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  overlays: OverlayItem[];
  onOverlaySelect: (id: string | null) => void;
  onOverlayMove: (id: string, x: number, y: number) => void;
}

export function useOverlayInteraction({
  canvasRef,
  overlays,
  onOverlaySelect,
  onOverlayMove,
}: UseOverlayInteractionOptions) {
  const dragStateRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const frameRef = useRef<number | null>(null);
  const pendingPositionRef = useRef<{ id: string; x: number; y: number } | null>(null);

  function flushPendingMove() {
    frameRef.current = null;
    const pending = pendingPositionRef.current;
    if (!pending) {
      return;
    }

    pendingPositionRef.current = null;
    onOverlayMove(pending.id, pending.x, pending.y);
  }

  function getCanvasPointFromClient(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const mappedScaleX = canvas.width / rect.width;
    const mappedScaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * mappedScaleX,
      y: (clientY - rect.top) * mappedScaleY,
    };
  }

  return {
    onPointerDownCapture: (event: ReactPointerEvent<HTMLDivElement>) => {
      const point = getCanvasPointFromClient(event.clientX, event.clientY);
      if (!point) {
        return;
      }

      const overlay = findOverlayAtPoint(overlays, point.x, point.y);
      if (!overlay) {
        if (event.target === event.currentTarget) {
          onOverlaySelect(null);
          dragStateRef.current = null;
        }
        return;
      }

      onOverlaySelect(overlay.id);
      dragStateRef.current = {
        id: overlay.id,
        offsetX: point.x - overlay.x,
        offsetY: point.y - overlay.y,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
      event.stopPropagation();
    },
    onPointerMoveCapture: (event: ReactPointerEvent<HTMLDivElement>) => {
      const point = getCanvasPointFromClient(event.clientX, event.clientY);
      const dragState = dragStateRef.current;
      if (!point || !dragState) {
        return;
      }

      pendingPositionRef.current = {
        id: dragState.id,
        x: Math.max(0, point.x - dragState.offsetX),
        y: Math.max(0, point.y - dragState.offsetY),
      };
      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(flushPendingMove);
      }
      event.preventDefault();
      event.stopPropagation();
    },
    onPointerUpCapture: (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragStateRef.current) {
        return;
      }

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        flushPendingMove();
      }
      dragStateRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      event.preventDefault();
      event.stopPropagation();
    },
    onPointerCancelCapture: (event: ReactPointerEvent<HTMLDivElement>) => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      pendingPositionRef.current = null;
      dragStateRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
  };
}
