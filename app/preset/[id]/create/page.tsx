'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, ImagePlus, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { mockStickers } from '@/lib/data/stickers'
import { getEditorPresetDocument } from '@/lib/data/preset-documents'
import { getPresetById as getPresetMetaById } from '@/lib/data/presets'
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
import { compilePreset } from '@/lib/preset-compiler'
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
  const [selectedImageSlot, setSelectedImageSlot] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const imageSlots = compiledPreset?.editorModel.imageSlots ?? []
  const textSlots = compiledPreset?.editorModel.textSlots ?? []

  useEffect(() => {
    setRenderInputs(buildInitialInputs(id))
    setImageFilterAdjustments({})
    setOverlays([])
    setSelectedOverlayId(null)
    setPendingImageSlot(null)
    setSelectedImageSlot(null)
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

    void renderPresetToCanvas(canvasRef.current, resolvedRenderModel, renderInputs, overlays)
  }, [overlays, renderInputs, resolvedRenderModel])

  const selectedOverlay = overlays.find((overlay) => overlay.id === selectedOverlayId) ?? null
  const inspectorControls = selectedOverlay ? getOverlayInspectorControls(selectedOverlay) : []
  const activeImageFilterSlot = selectedImageSlot
    ? imageSlots.find((slot) => slot.inputName === selectedImageSlot) ?? null
    : null
  const activeImageFilters = activeImageFilterSlot
    ? getImageFilterAdjustments(imageFilterAdjustments, activeImageFilterSlot.inputName)
    : defaultImageFilterAdjustments

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

      const imageValue: RenderImageValue = {
        kind: 'image',
        url,
      }
      setRenderInputs((current) => ({
        ...current,
        [pendingImageSlot]: imageValue,
      }))
      setPendingImageSlot(null)
      event.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const handleComplete = () => {
    if (!canvasRef.current) {
      return
    }

    const uri = canvasRef.current.toDataURL('image/png')
    localStorage.setItem('lastCreatedImage', uri)
    router.push(`/preset/${id}/result?image=${encodeURIComponent(uri)}`)
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
            <Button onClick={handleComplete} className="bg-primary hover:bg-primary/90">
              완료
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          <section className="bg-white rounded-2xl border-4 border-foreground/10 overflow-hidden y2k-shadow p-4">
            <div className="mx-auto max-w-[720px]">
              <canvas
                ref={canvasRef}
                width={compiledPreset.renderModel.width}
                height={compiledPreset.renderModel.height}
                className="w-full h-auto rounded-xl bg-white"
              />
            </div>
          </section>

          <aside className="space-y-6">
            <section className="bg-card rounded-2xl p-6 border-2 border-foreground/10 y2k-shadow">
              <h2 className="text-lg font-bold mb-4 font-[var(--font-display)] flex items-center gap-2">
                <ImagePlus className="w-5 h-5 text-primary" />
                사진 슬롯
              </h2>
              <div className="space-y-3">
                {imageSlots.map((slot) => {
                  const hasImage =
                    typeof renderInputs[slot.inputName] === 'object' &&
                    renderInputs[slot.inputName] !== null

                  return (
                    <div
                      key={slot.inputName}
                      className={`rounded-xl border p-3 space-y-3 ${
                        selectedImageSlot === slot.inputName
                          ? 'border-primary bg-primary/5'
                          : 'border-foreground/10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          className="min-w-0 text-left"
                          onClick={() => setSelectedImageSlot(slot.inputName)}
                        >
                          <p className="font-medium">{slot.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round(slot.width)} x {Math.round(slot.height)}
                          </p>
                        </button>
                        <Button
                          size="sm"
                          variant={hasImage ? 'outline' : 'default'}
                          onClick={() => {
                            setPendingImageSlot(slot.inputName)
                            fileInputRef.current?.click()
                          }}
                        >
                          {hasImage ? '교체' : '추가'}
                        </Button>
                      </div>
                      {hasImage ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full"
                          onClick={() =>
                            setRenderInputs((current) => ({
                              ...current,
                              [slot.inputName]: null,
                            }))
                          }
                        >
                          비우기
                        </Button>
                      ) : null}
                    </div>
                  )
                })}
              </div>
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
                </div>
              </section>
            ) : null}

            {textSlots.length > 0 ? (
              <section className="bg-card rounded-2xl p-6 border-2 border-foreground/10 y2k-shadow">
                <h2 className="text-lg font-bold mb-4 font-[var(--font-display)]">
                  텍스트
                </h2>
                <div className="space-y-3">
                  {textSlots.map((slot) => {
                    const value = typeof renderInputs[slot.inputName] === 'string'
                      ? renderInputs[slot.inputName]
                      : ''

                    return slot.maxLines && slot.maxLines > 1 ? (
                      <div key={slot.inputName} className="space-y-2">
                        <label className="text-sm font-medium">{slot.label}</label>
                        <Textarea
                          value={value}
                          rows={slot.maxLines}
                          onChange={(event) =>
                            setRenderInputs((current) => ({
                              ...current,
                              [slot.inputName]: event.target.value,
                            }))
                          }
                        />
                      </div>
                    ) : (
                      <div key={slot.inputName} className="space-y-2">
                        <label className="text-sm font-medium">{slot.label}</label>
                        <Input
                          value={value}
                          onChange={(event) =>
                            setRenderInputs((current) => ({
                              ...current,
                              [slot.inputName]: event.target.value,
                            }))
                          }
                        />
                      </div>
                    )
                  })}
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
              <Button onClick={handleComplete} className="w-full bg-primary hover:bg-primary/90">
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
    </div>
  )
}
