"use client";

import { forwardRef, useRef } from "react";

type Props = {
  className?: string;
};

const SignaturePad = forwardRef<HTMLCanvasElement, Props>(function SignaturePad(
  { className },
  ref,
) {
  const drawing = useRef(false);

  function pos(
    canvas: HTMLCanvasElement,
    e: React.PointerEvent<HTMLCanvasElement>,
  ) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function ensureCtx(canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(rect.width * dpr);
    const h = Math.floor(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    return ctx;
  }

  return (
    <canvas
      ref={ref}
      className={
        className ??
        "touch-none h-36 w-full rounded-xl border border-ink/15 bg-white"
      }
      onPointerDown={(e) => {
        const canvas = e.currentTarget;
        canvas.setPointerCapture(e.pointerId);
        drawing.current = true;
        const ctx = ensureCtx(canvas);
        if (!ctx) return;
        const { x, y } = pos(canvas, e);
        ctx.beginPath();
        ctx.moveTo(x, y);
      }}
      onPointerMove={(e) => {
        if (!drawing.current) return;
        const canvas = e.currentTarget;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const { x, y } = pos(canvas, e);
        ctx.lineTo(x, y);
        ctx.stroke();
      }}
      onPointerUp={(e) => {
        drawing.current = false;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }}
      onPointerCancel={(e) => {
        drawing.current = false;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }}
    />
  );
});

export default SignaturePad;

export function clearSignatureCanvas(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2.5;
}

export function signatureCanvasToPngBlob(
  canvas: HTMLCanvasElement | null,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (!canvas) {
      resolve(null);
      return;
    }
    canvas.toBlob((b) => resolve(b), "image/png");
  });
}
