'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Sparkles, Trash2 } from 'lucide-react'
import { ImageSourceDialog } from '@/components/image-source-dialog'
import { Button } from '@/components/ui/button'
import { mockStickers } from '@/lib/data/stickers'
import { getEditorPresetDocument } from '@/lib/data/preset-documents'
import { getPresetById as getPresetMetaById } from '@/lib/data/presets'
import { renderPresetResultDataUrl } from '@/lib/export'
import {
  applyImageFilterAdjustments,
  defaultImageFilterAdjustments,
  getImageFilterAdjustments,
  type ImageFilterAdjustmentMap,
} from '@/lib/editor/filter-state'
import {
  applyOverlayInspectorValue,
  getOverlayInspectorControls,
  getOverlayListMeta,
} from '@/lib/overlay-presenter'
import type { OverlayItem } from '@/lib/overlay-editor'
import { compileExportModel, compilePreset } from '@/lib/preset-compiler'
import {
  renderPresetToCanvas,
  type RenderImageValue,
  type RenderInputs,
} from '@/lib/preset-engine'
import { toast } from 'sonner'

interface CreatePageProps {
  params: Promise<{ id: string }>
}

function buildInitialInputs(presetId: string): RenderInputs {
  const presetDocument = getEditorPresetDocument(presetId)
  if (!presetDocument) {
    return {}
  }

  return presetDocument.inputs.reduce<RenderInputs>((acc, input) => {
    acc[input.name] = input.defaultValue ?? (input.type === 'image' ? null : '')
    return acc
  }, {})
}

function createStickerOverlay(imageUrl: string): OverlayItem {
  return {
    id: `sticker-${crypto.randomUUID()}`,
    kind: 'sticker',
    label: 'Sticker',
    assetUrl: imageUrl,
    x: 120,
    y: 120,
    width: 120,
    height: 120,
    rotation: 0,
  }
}

export default function CreatePage({ params }: CreatePageProps) {
  const router = useRouter()
  const { id } = React.use(params)
  const presetMeta = getPresetMetaById(id)
  const presetDocument = getEditorPresetDocument(id)
  const compiledPreset = useMemo(
    () => (presetDocument ? compilePreset(presetDocument) : null),
    [presetDocument],
  )

  const [renderInputs, setRenderInputs] = useState<RenderInputs>(() => buildInitialInputs(id))
  const [imageFilterAdjustments, setImageFilterAdjustments] = useState<ImageFilterAdjustmentMap>({})
  const [overlays, setOverlays] = useState<OverlayItem[]>([])
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null)
  const [pendingImageSlot, setPendingImageSlot] = useState<string | null>(null)
  const [isImageSourceDialogOpen, setIsImageSourceDialogOpen] = useState(false)
  const [selectedImageSlot, setSelectedImageSlot] = useState<string | null>(null)
  const [activeTextInput, setActiveTextInput] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const canvasViewportRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [canvasViewportWidth, setCanvasViewportWidth] = useState(0)
  const imageSlots = compiledPreset?.editorModel.imageSlots ?? []
  const textSlots = compiledPreset?.editorModel.textSlots ?? []

  useEffect(() => {
    setRenderInputs(buildInitialInputs(id))
    setImageFilterAdjustments({})
    setOverlays([])
    setSelectedOverlayId(null)
    setPendingImageSlot(null)
    setIsImageSourceDialogOpen(false)
    setSelectedImageSlot(null)
    setActiveTextInput(null)
  }, [id])

  useEffect(() => {
    if (selectedImageSlot || imageSlots.length === 0) {
      return
    }

    setSelectedImageSlot(imageSlots[0].inputName)
  }, [imageSlots, selectedImageSlot])

  const resolvedRenderModel = useMemo(
    () =>
      compiledPreset
        ? applyImageFilterAdjustments(compiledPreset.renderModel, imageFilterAdjustments)
        : null,
    [compiledPreset, imageFilterAdjustments],
  )

  useEffect(() => {
    if (!resolvedRenderModel || !canvasRef.current) {
      return
    }

    void renderPresetToCanvas(canvasRef.current, resolvedRenderModel, renderInputs, overlays, {
      hiddenTextInputs: textSlots
        .filter(
          (slot) =>
            slot.appearanceScope === 'adaptive' || slot.inputName === activeTextInput,
        )
        .map((slot) => slot.inputName),
    })
  }, [activeTextInput, overlays, renderInputs, resolvedRenderModel, textSlots])

  useEffect(() => {
    const element = canvasViewportRef.current
    if (!element) {
      return
    }

    const updateSize = () => {
      setCanvasViewportWidth(element.clientWidth)
    }

    updateSize()
    const observer = new ResizeObserver(() => updateSize())
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  const selectedOverlay = overlays.find((overlay) => overlay.id === selectedOverlayId) ?? null
  const inspectorControls = selectedOverlay ? getOverlayInspectorControls(selectedOverlay) : []
  const activeImageFilterSlot = selectedImageSlot
    ? imageSlots.find((slot) => slot.inputName === selectedImageSlot) ?? null
    : null
  const activeImageFilters = activeImageFilterSlot
    ? getImageFilterAdjustments(imageFilterAdjustments, activeImageFilterSlot.inputName)
    : defaultImageFilterAdjustments
  const exportModel = useMemo(
    () =>
      resolvedRenderModel
        ? compileExportModel(resolvedRenderModel, compiledPreset.editorModel, overlays)
        : null,
    [compiledPreset?.editorModel, overlays, resolvedRenderModel],
  )
  const canvasScale = canvasViewportWidth > 0
    ? canvasViewportWidth / compiledPreset.renderModel.width
    : 1
  const canvasViewportHeight = compiledPreset.renderModel.height * canvasScale

  const applyImageToPendingSlot = (url: string) => {
    if (!pendingImageSlot) {
      return
    }

    const imageValue: RenderImageValue = {
      kind: 'image',
      url,
    }

    setRenderInputs((current) => ({
      ...current,
      [pendingImageSlot]: imageValue,
    }))
    setSelectedImageSlot(pendingImageSlot)
    setPendingImageSlot(null)
    setIsImageSourceDialogOpen(false)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !pendingImageSlot) {
      return
    }

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      const url = loadEvent.target?.result
      if (typeof url !== 'string') {
        return
      }

      applyImageToPendingSlot(url)
      event.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const handleComplete = async () => {
    if (!resolvedRenderModel || !exportModel) {
      return
    }

    const uri = await renderPresetResultDataUrl({
      renderModel: resolvedRenderModel,
      exportModel,
      inputs: renderInputs,
      overlays,
      type: 'image/png',
    })
    localStorage.setItem('lastCreatedImage', uri)
    router.push(`/preset/${id}/result?image=${encodeURIComponent(uri)}`)
  }

  const getTextFieldStyle = (slot: (typeof textSlots)[number]): React.CSSProperties => {
    const padding = typeof slot.style.padding === 'number' ? slot.style.padding : 0
    const isPresetDisplaySlot =
      slot.appearanceScope === 'preset' && activeTextInput !== slot.inputName

    return {
      left: slot.x * canvasScale,
      top: slot.y * canvasScale,
      width: slot.width * canvasScale,
      minHeight: Math.max(slot.height * canvasScale, slot.style.fontSize * canvasScale * 1.2),
      padding: padding * canvasScale,
      color: slot.style.fill,
      fontFamily: slot.style.fontFamily,
      fontSize: slot.style.fontSize * canvasScale,
      fontWeight: slot.style.fontWeight,
      fontStyle: slot.style.fontStyle,
      lineHeight: String(slot.style.lineHeight ?? 1.2),
      textAlign: slot.style.textAlign === 'justify' ? 'left' : slot.style.textAlign,
      backgroundColor: slot.style.backgroundColor ?? 'transparent',
      color: isPresetDisplaySlot ? 'transparent' : slot.style.fill,
      caretColor: slot.style.fill,
    }
  }

  if (!compiledPreset || !presetDocument || !presetMeta) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-lg">프리셋을 불러올 수 없어요.</p>
          <Link href="/">
            <Button>홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b-2 border-foreground/10 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/preset/${id}`} className="p-2 hover:bg-muted rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold font-[var(--font-display)]">
                사진 꾸미기
              </h1>
              <p className="text-sm text-muted-foreground">{presetMeta.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {selectedOverlay ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setOverlays((current) =>
                    current.filter((overlay) => overlay.id !== selectedOverlay.id),
                  )
                  setSelectedOverlayId(null)
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            ) : null}
            <Button onClick={() => void handleComplete()} className="bg-primary hover:bg-primary/90">
              완료
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          <section className="bg-white rounded-2xl border-4 border-foreground/10 overflow-hidden y2k-shadow p-4">
            <div
              ref={canvasViewportRef}
              className="relative mx-auto max-w-[720px]"
              style={{ height: canvasViewportHeight || undefined }}
            >
              <canvas
                ref={canvasRef}
                width={compiledPreset.renderModel.width}
                height={compiledPreset.renderModel.height}
                className="absolute inset-0 h-full w-full rounded-xl bg-white"
              />
              <div className="absolute inset-0">
                {imageSlots.map((slot) => {
                  const hasImage =
                    typeof renderInputs[slot.inputName] === 'object' &&
                    renderInputs[slot.inputName] !== null

                  return (
                    <button
                      key={slot.inputName}
                      type="button"
                      className={`group absolute overflow-hidden rounded-xl border-2 text-left transition-all ${
                        selectedImageSlot === slot.inputName
                          ? 'border-primary shadow-[0_0_0_4px_rgba(255,92,0,0.12)]'
                          : hasImage
                            ? 'border-transparent hover:border-white/70'
                            : 'border-dashed border-white/70 bg-black/15 hover:bg-black/25'
                      }`}
                      style={{
                        left: slot.x * canvasScale,
                        top: slot.y * canvasScale,
                        width: slot.width * canvasScale,
                        height: slot.height * canvasScale,
                      }}
                      onClick={() => {
                        setSelectedImageSlot(slot.inputName)
                        setPendingImageSlot(slot.inputName)
                        setIsImageSourceDialogOpen(true)
                      }}
                    >
                      <div
                        className={`absolute inset-0 transition-opacity ${
                          hasImage ? 'bg-black/0 group-hover:bg-black/18' : 'bg-transparent'
                        }`}
                      />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/65 via-black/10 to-transparent px-3 py-3 text-white">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{slot.label}</p>
                          <p className="text-xs text-white/80">
                            {hasImage ? '탭해서 교체하기' : '사진 추가'}
                          </p>
                        </div>
                        <span className="rounded-full border border-white/35 bg-white/10 px-2.5 py-1 text-[11px]">
                          {hasImage ? 'Replace' : 'Add'}
                        </span>
                      </div>
                    </button>
                  )
                })}

                {textSlots.map((slot) => {
                  const value = typeof renderInputs[slot.inputName] === 'string'
                    ? renderInputs[slot.inputName]
                    : ''
                  const commonClassName = `absolute rounded-lg border border-transparent bg-transparent text-foreground outline-none transition-colors placeholder:text-foreground/45 focus:border-primary/40 focus:bg-white/10 ${slot.maxLines && slot.maxLines > 1 ? 'resize-none' : ''}`

                  return slot.maxLines && slot.maxLines > 1 ? (
                    <textarea
                      key={slot.inputName}
                      value={value}
                      rows={slot.maxLines}
                      placeholder={slot.label}
                      className={commonClassName}
                      style={getTextFieldStyle(slot)}
                      onChange={(event) =>
                        setRenderInputs((current) => ({
                          ...current,
                          [slot.inputName]: event.target.value,
                        }))
                      }
                      onFocus={() => setActiveTextInput(slot.inputName)}
                      onBlur={() => setActiveTextInput((current) => (current === slot.inputName ? null : current))}
                    />
                  ) : (
                    <input
                      key={slot.inputName}
                      value={value}
                      placeholder={slot.label}
                      className={commonClassName}
                      style={getTextFieldStyle(slot)}
                      onChange={(event) =>
                        setRenderInputs((current) => ({
                          ...current,
                          [slot.inputName]: event.target.value,
                        }))
                      }
                      onFocus={() => setActiveTextInput(slot.inputName)}
                      onBlur={() => setActiveTextInput((current) => (current === slot.inputName ? null : current))}
                    />
                  )
                })}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="bg-card rounded-2xl p-6 border-2 border-foreground/10 y2k-shadow">
              <h2 className="text-lg font-bold mb-2 font-[var(--font-display)]">
                직접 편집
              </h2>
              <p className="text-sm text-muted-foreground">
                사진 칸을 눌러 이미지를 고르고, 프레임 안 텍스트를 바로 수정해 보세요.
              </p>
            </section>

            {activeImageFilterSlot ? (
              <section className="bg-card rounded-2xl p-6 border-2 border-foreground/10 y2k-shadow">
                <h2 className="text-lg font-bold mb-4 font-[var(--font-display)]">
                  이미지 필터
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {activeImageFilterSlot.label}에 프리셋 필터 위로 추가 보정을 적용합니다.
                </p>
                <div className="space-y-4">
                  {[
                    { key: 'brightness', label: '밝기', min: -0.5, max: 0.5, step: 0.01 },
                    { key: 'contrast', label: '대비', min: -0.5, max: 0.5, step: 0.01 },
                    { key: 'saturation', label: '채도', min: -0.5, max: 0.8, step: 0.01 },
                    { key: 'blur', label: '블러', min: 0, max: 8, step: 0.1 },
                    { key: 'sepia', label: '세피아', min: 0, max: 1, step: 0.01 },
                  ].map((filterControl) => (
                    <label key={filterControl.key} className="block space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{filterControl.label}</span>
                        <span className="text-muted-foreground">
                          {activeImageFilters[filterControl.key as keyof typeof activeImageFilters]}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={filterControl.min}
                        max={filterControl.max}
                        step={filterControl.step}
                        value={activeImageFilters[filterControl.key as keyof typeof activeImageFilters] as number}
                        onChange={(event) =>
                          setImageFilterAdjustments((current) => ({
                            ...current,
                            [activeImageFilterSlot.inputName]: {
                              ...getImageFilterAdjustments(current, activeImageFilterSlot.inputName),
                              [filterControl.key]: Number(event.target.value),
                            },
                          }))
                        }
                        className="w-full"
                      />
                    </label>
                  ))}

                  <label className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 px-3 py-2">
                    <span className="text-sm font-medium">흑백</span>
                    <input
                      type="checkbox"
                      checked={activeImageFilters.grayscale}
                      onChange={(event) =>
                        setImageFilterAdjustments((current) => ({
                          ...current,
                          [activeImageFilterSlot.inputName]: {
                            ...getImageFilterAdjustments(current, activeImageFilterSlot.inputName),
                            grayscale: event.target.checked,
                          },
                        }))
                      }
                    />
                  </label>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() =>
                      setImageFilterAdjustments((current) => ({
                        ...current,
                        [activeImageFilterSlot.inputName]: defaultImageFilterAdjustments,
                      }))
                    }
                  >
                    필터 초기화
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      setRenderInputs((current) => ({
                        ...current,
                        [activeImageFilterSlot.inputName]: null,
                      }))
                    }
                  >
                    사진 비우기
                  </Button>
                </div>
              </section>
            ) : null}

            <section className="bg-card rounded-2xl p-6 border-2 border-foreground/10 y2k-shadow">
              <h2 className="text-lg font-bold mb-4 font-[var(--font-display)]">
                스티커
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {mockStickers.map((sticker) => (
                  <button
                    key={sticker.id}
                    onClick={() => {
                      const overlay = createStickerOverlay(sticker.imageUrl)
                      setOverlays((current) => [...current, overlay])
                      setSelectedOverlayId(overlay.id)
                      toast.success('스티커가 추가되었어요.')
                    }}
                    className="aspect-square rounded-xl border-2 border-foreground/10 hover:border-primary hover:scale-105 transition-all p-2 bg-white"
                  >
                    <img
                      src={sticker.imageUrl}
                      alt={sticker.name}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            </section>

            {overlays.length > 0 ? (
              <section className="bg-card rounded-2xl p-6 border-2 border-foreground/10 y2k-shadow space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold font-[var(--font-display)]">
                    오버레이
                  </h2>
                  <span className="text-sm text-muted-foreground">{overlays.length}개</span>
                </div>
                <div className="space-y-2">
                  {overlays.map((overlay, index) => {
                    const meta = getOverlayListMeta(overlay, index)
                    return (
                      <button
                        key={overlay.id}
                        type="button"
                        className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                          overlay.id === selectedOverlayId
                            ? 'border-primary bg-primary/10'
                            : 'border-foreground/10 hover:border-primary/40'
                        }`}
                        onClick={() => setSelectedOverlayId(overlay.id)}
                      >
                        <strong className="block">{meta.title}</strong>
                        <span className="text-xs text-muted-foreground">{meta.subtitle}</span>
                      </button>
                    )
                  })}
                </div>

                {selectedOverlay ? (
                  <div className="space-y-3 border-t border-foreground/10 pt-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">선택한 오버레이</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setOverlays((current) =>
                            current.filter((overlay) => overlay.id !== selectedOverlay.id),
                          )
                          setSelectedOverlayId(null)
                        }}
                      >
                        삭제
                      </Button>
                    </div>
                    {inspectorControls.map((control) => (
                      <label key={control.key} className="block space-y-2">
                        <span className="text-sm font-medium">{control.label}</span>
                        {control.type === 'range' ? (
                          <input
                            type="range"
                            min={control.min}
                            max={control.max}
                            value={control.value}
                            onChange={(event) =>
                              setOverlays((current) =>
                                current.map((overlay) =>
                                  overlay.id === selectedOverlay.id
                                    ? applyOverlayInspectorValue(
                                        overlay,
                                        control.key,
                                        Number(event.target.value),
                                      )
                                    : overlay,
                                ),
                              )
                            }
                            className="w-full"
                          />
                        ) : (
                          <Input
                            value={control.value}
                            onChange={(event) =>
                              setOverlays((current) =>
                                current.map((overlay) =>
                                  overlay.id === selectedOverlay.id
                                    ? applyOverlayInspectorValue(
                                        overlay,
                                        control.key,
                                        event.target.value,
                                      )
                                    : overlay,
                                ),
                              )
                            }
                          />
                        )}
                      </label>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className="bg-card rounded-2xl p-6 border-2 border-foreground/10 y2k-shadow">
              <h2 className="text-lg font-bold mb-4 font-[var(--font-display)] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                출력
              </h2>
              <Button onClick={() => void handleComplete()} className="w-full bg-primary hover:bg-primary/90">
                <Download className="w-4 h-4 mr-2" />
                결과 보기
              </Button>
            </section>
          </aside>
        </div>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleImageUpload}
      />
      <ImageSourceDialog
        open={isImageSourceDialogOpen}
        slotLabel={
          imageSlots.find((slot) => slot.inputName === pendingImageSlot)?.label ?? '사진 슬롯'
        }
        onOpenChange={(open) => {
          setIsImageSourceDialogOpen(open)
          if (!open) {
            setPendingImageSlot(null)
          }
        }}
        onRequestFileSelect={() => fileInputRef.current?.click()}
        onImageResolved={applyImageToPendingSlot}
      />
    </div>
  )
}
