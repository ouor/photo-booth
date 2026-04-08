import type { AnalogVideoEffectNode } from "./preset-compiler";

interface AnalogVideoSettings {
  channelShiftPx: number;
  bleedStrength: number;
  blurPx: number;
  noiseAmount: number;
  scanlineOpacity: number;
  waveAmplitudePx: number;
  waveFrequency: number;
  ghostOpacity: number;
  tintStrength: number;
  bottomTrackingOpacity: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function noiseAt(x: number, y: number, seed: number) {
  const value = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  return value - Math.floor(value);
}

function getPresetSettings(effect: AnalogVideoEffectNode): AnalogVideoSettings {
  const intensity = clamp(effect.intensity, 0, 1.5);

  switch (effect.preset) {
    case "ntsc-clean":
      return {
        channelShiftPx: 1.5 * intensity,
        bleedStrength: 0.24 * intensity,
        blurPx: 0.8 * intensity,
        noiseAmount: 6 * intensity,
        scanlineOpacity: 0.08 * intensity,
        waveAmplitudePx: 1.8 * intensity,
        waveFrequency: 0.02,
        ghostOpacity: 0.08 * intensity,
        tintStrength: 0.06 * intensity,
        bottomTrackingOpacity: 0,
      };
    case "vhs-home-video":
      return {
        channelShiftPx: 3.5 * intensity,
        bleedStrength: 0.42 * intensity,
        blurPx: 1.6 * intensity,
        noiseAmount: 12 * intensity,
        scanlineOpacity: 0.14 * intensity,
        waveAmplitudePx: 4 * intensity,
        waveFrequency: 0.03,
        ghostOpacity: 0.14 * intensity,
        tintStrength: 0.1 * intensity,
        bottomTrackingOpacity: 0.08 * intensity,
      };
    case "vhs-damaged-tape":
      return {
        channelShiftPx: 5.5 * intensity,
        bleedStrength: 0.6 * intensity,
        blurPx: 2.4 * intensity,
        noiseAmount: 20 * intensity,
        scanlineOpacity: 0.2 * intensity,
        waveAmplitudePx: 7 * intensity,
        waveFrequency: 0.045,
        ghostOpacity: 0.2 * intensity,
        tintStrength: 0.16 * intensity,
        bottomTrackingOpacity: 0.24 * intensity,
      };
  }
}

function createWorkingCanvas(source: HTMLCanvasElement) {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to create analog video working context.");
  }
  ctx.drawImage(source, 0, 0);
  return { canvas, ctx };
}

function applyWaveDistortion(source: HTMLCanvasElement, settings: AnalogVideoSettings) {
  const { canvas, ctx } = createWorkingCanvas(source);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y += 1) {
    const offset =
      Math.sin(y * settings.waveFrequency) * settings.waveAmplitudePx +
      Math.sin(y * settings.waveFrequency * 0.37 + 0.8) * settings.waveAmplitudePx * 0.35;
    ctx.drawImage(source, 0, y, canvas.width, 1, offset, y, canvas.width, 1);
  }

  return canvas;
}

function applyGhostLayer(base: HTMLCanvasElement, settings: AnalogVideoSettings) {
  if (settings.ghostOpacity <= 0) {
    return base;
  }

  const { canvas, ctx } = createWorkingCanvas(base);
  ctx.globalAlpha = settings.ghostOpacity;
  ctx.filter = `blur(${Math.max(0.2, settings.blurPx * 1.4)}px)`;
  ctx.drawImage(base, -settings.channelShiftPx * 1.2, 0);
  ctx.globalAlpha = 1;
  ctx.filter = "none";
  return canvas;
}

function sampleChannel(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  channel: number,
) {
  const safeX = clamp(Math.round(x), 0, width - 1);
  const safeY = clamp(Math.round(y), 0, height - 1);
  return data[(safeY * width + safeX) * 4 + channel];
}

function applyChannelArtifacts(canvas: HTMLCanvasElement, settings: AnalogVideoSettings) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const source = new Uint8ClampedArray(imageData.data);
  const data = imageData.data;

  for (let y = 0; y < canvas.height; y += 1) {
    const rowFactor = 0.65 + 0.35 * Math.sin(y * 0.021);
    for (let x = 0; x < canvas.width; x += 1) {
      const index = (y * canvas.width + x) * 4;
      const shift = settings.channelShiftPx * rowFactor;
      const bleedSample = settings.channelShiftPx * 0.6;

      const redBase = sampleChannel(source, canvas.width, canvas.height, x + shift, y, 0);
      const greenBase = sampleChannel(source, canvas.width, canvas.height, x, y, 1);
      const blueBase = sampleChannel(source, canvas.width, canvas.height, x - shift, y, 2);

      const redBleed = sampleChannel(
        source,
        canvas.width,
        canvas.height,
        x + shift + bleedSample,
        y,
        0,
      );
      const blueBleed = sampleChannel(
        source,
        canvas.width,
        canvas.height,
        x - shift - bleedSample,
        y,
        2,
      );

      data[index] = clamp(
        redBase * (1 - settings.bleedStrength) + redBleed * settings.bleedStrength,
        0,
        255,
      );
      data[index + 1] = clamp(greenBase * (1 - settings.tintStrength) + redBase * settings.tintStrength * 0.2, 0, 255);
      data[index + 2] = clamp(
        blueBase * (1 - settings.bleedStrength) + blueBleed * settings.bleedStrength,
        0,
        255,
      );
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function applyNoiseAndScanlines(canvas: HTMLCanvasElement, settings: AnalogVideoSettings) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const seed = settings.noiseAmount * 0.173 + settings.waveAmplitudePx * 0.113;

  for (let y = 0; y < canvas.height; y += 1) {
    const scanlineFactor = y % 2 === 0 ? 1 - settings.scanlineOpacity : 1;
    const trackingBand =
      settings.bottomTrackingOpacity > 0 && y > canvas.height * 0.88
        ? 1 - settings.bottomTrackingOpacity * (0.65 + 0.35 * Math.sin(y * 0.5))
        : 1;

    for (let x = 0; x < canvas.width; x += 1) {
      const index = (y * canvas.width + x) * 4;
      const noise =
        (noiseAt(x, y, seed) - 0.5) * settings.noiseAmount +
        (noiseAt(x + 31, y + 17, seed) - 0.5) * settings.noiseAmount * 0.35;

      data[index] = clamp(data[index] * scanlineFactor * trackingBand + noise, 0, 255);
      data[index + 1] = clamp(
        data[index + 1] * scanlineFactor * trackingBand + noise * 0.7,
        0,
        255,
      );
      data[index + 2] = clamp(
        data[index + 2] * scanlineFactor * trackingBand + noise * 1.15,
        0,
        255,
      );
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function applyBottomTrackingBand(canvas: HTMLCanvasElement, settings: AnalogVideoSettings) {
  if (settings.bottomTrackingOpacity <= 0) {
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const bandHeight = Math.round(canvas.height * 0.08);
  const bandY = canvas.height - bandHeight;

  ctx.save();
  ctx.globalAlpha = settings.bottomTrackingOpacity;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (let y = 0; y < bandHeight; y += 2) {
    const jitter = Math.sin(y * 0.45) * settings.waveAmplitudePx * 1.4;
    ctx.fillRect(jitter, bandY + y, canvas.width, 1);
  }
  ctx.restore();
}

export function applyAnalogVideoEffects(
  targetCanvas: HTMLCanvasElement,
  effects: AnalogVideoEffectNode[],
) {
  if (effects.length === 0) {
    return;
  }

  let workingCanvas = targetCanvas;

  effects.forEach((effect) => {
    const settings = getPresetSettings(effect);
    let stagedCanvas = applyWaveDistortion(workingCanvas, settings);
    stagedCanvas = applyGhostLayer(stagedCanvas, settings);

    const blurCanvas = document.createElement("canvas");
    blurCanvas.width = stagedCanvas.width;
    blurCanvas.height = stagedCanvas.height;
    const blurCtx = blurCanvas.getContext("2d");
    if (!blurCtx) {
      return;
    }

    blurCtx.filter = `blur(${Math.max(0, settings.blurPx)}px) saturate(${1 - settings.tintStrength * 0.35})`;
    blurCtx.drawImage(stagedCanvas, 0, 0);
    blurCtx.filter = "none";

    applyChannelArtifacts(blurCanvas, settings);
    applyNoiseAndScanlines(blurCanvas, settings);
    applyBottomTrackingBand(blurCanvas, settings);

    workingCanvas = blurCanvas;
  });

  const targetContext = targetCanvas.getContext("2d");
  if (!targetContext) {
    return;
  }

  targetContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  targetContext.drawImage(workingCanvas, 0, 0);
}
