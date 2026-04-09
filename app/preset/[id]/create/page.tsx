'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Trash2, Download } from 'lucide-react'
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva'
import { Button } from '@/components/ui/button'
import { mockStickers } from '@/lib/data/stickers'
import { CanvasImage, CanvasSticker } from '@/lib/types/editor'
import Konva from 'konva'

interface CreatePageProps {
  params: Promise<{ id: string }>
}

export default function CreatePage({ params }: CreatePageProps) {
  const router = useRouter()
  const unwrappedParams = React.use(params)
  const [images, setImages] = useState<CanvasImage[]>([])
  const [stickers, setStickers] = useState<CanvasSticker[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<HTMLImageElement[]>([])
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)

  const canvasWidth = 800
  const canvasHeight = 1200

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new window.Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const newImage: CanvasImage = {
            id: `img-${Date.now()}-${Math.random()}`,
            src: img.src,
            x: 100,
            y: 100,
            width: 300,
            height: 400,
            rotation: 0,
          }
          setImages((prev) => [...prev, newImage])
          setUploadedImages((prev) => [...prev, img])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  // Add sticker to canvas
  const handleAddSticker = (stickerId: string, imageUrl: string) => {
    const newSticker: CanvasSticker = {
      id: `sticker-${Date.now()}-${Math.random()}`,
      stickerId,
      imageUrl,
      x: canvasWidth / 2 - 50,
      y: canvasHeight / 2 - 50,
      width: 100,
      height: 100,
      rotation: 0,
    }
    setStickers((prev) => [...prev, newSticker])
  }

  // Delete selected element
  const handleDelete = () => {
    if (!selectedId) return

    if (selectedId.startsWith('img-')) {
      setImages((prev) => prev.filter((img) => img.id !== selectedId))
    } else if (selectedId.startsWith('sticker-')) {
      setStickers((prev) => prev.filter((sticker) => sticker.id !== selectedId))
    }
    setSelectedId(null)
  }

  // Download canvas as image
  const handleDownload = () => {
    if (!stageRef.current) return

    const uri = stageRef.current.toDataURL({ pixelRatio: 2 })
    const link = document.createElement('a')
    link.download = `photo-booth-${Date.now()}.png`
    link.href = uri
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b-2 border-foreground/10 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/preset/${unwrappedParams.id}`} className="p-2 hover:bg-muted rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold font-[var(--font-display)]">
              사진 꾸미기
            </h1>
          </div>
          <div className="flex gap-2">
            {selectedId && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90">
              <Download className="w-4 h-4 mr-2" />
              다운로드
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          {/* Canvas Area */}
          <div className="bg-white rounded-2xl border-4 border-foreground/10 overflow-hidden y2k-shadow">
            <div className="overflow-auto">
              <Stage
                ref={stageRef}
                width={canvasWidth}
                height={canvasHeight}
                style={{ background: 'linear-gradient(to bottom, #FFE5F0, #FFF5FA)' }}
                onMouseDown={(e) => {
                  const clickedOnEmpty = e.target === e.target.getStage()
                  if (clickedOnEmpty) {
                    setSelectedId(null)
                  }
                }}
              >
                <Layer>
                  {/* Render images */}
                  {images.map((img, index) => {
                    const imageElement = uploadedImages[index]
                    if (!imageElement) return null

                    return (
                      <ImageElement
                        key={img.id}
                        image={img}
                        imageElement={imageElement}
                        isSelected={img.id === selectedId}
                        onSelect={() => setSelectedId(img.id)}
                        onChange={(newAttrs) => {
                          setImages((prev) =>
                            prev.map((i) => (i.id === img.id ? { ...i, ...newAttrs } : i))
                          )
                        }}
                      />
                    )
                  })}

                  {/* Render stickers */}
                  {stickers.map((sticker) => (
                    <StickerElement
                      key={sticker.id}
                      sticker={sticker}
                      isSelected={sticker.id === selectedId}
                      onSelect={() => setSelectedId(sticker.id)}
                      onChange={(newAttrs) => {
                        setStickers((prev) =>
                          prev.map((s) => (s.id === sticker.id ? { ...s, ...newAttrs } : s))
                        )
                      }}
                    />
                  ))}
                </Layer>
              </Stage>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upload Photos */}
            <section className="bg-card rounded-2xl p-6 border-2 border-foreground/10 y2k-shadow">
              <h2 className="text-lg font-bold mb-4 font-[var(--font-display)]">
                사진 추가
              </h2>
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-foreground/20 rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    클릭하여 사진 업로드
                  </p>
                </div>
              </label>
            </section>

            {/* Stickers */}
            <section className="bg-card rounded-2xl p-6 border-2 border-foreground/10 y2k-shadow">
              <h2 className="text-lg font-bold mb-4 font-[var(--font-display)]">
                스티커
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {mockStickers.map((sticker) => (
                  <button
                    key={sticker.id}
                    onClick={() => handleAddSticker(sticker.id, sticker.imageUrl)}
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
          </div>
        </div>
      </main>
    </div>
  )
}

// Image element component
function ImageElement({
  image,
  imageElement,
  isSelected,
  onSelect,
  onChange,
}: {
  image: CanvasImage
  imageElement: HTMLImageElement
  isSelected: boolean
  onSelect: () => void
  onChange: (attrs: Partial<CanvasImage>) => void
}) {
  const imageRef = useRef<Konva.Image>(null)
  const transformerRef = useRef<Konva.Transformer>(null)

  React.useEffect(() => {
    if (isSelected && imageRef.current && transformerRef.current) {
      transformerRef.current.nodes([imageRef.current])
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  return (
    <>
      <KonvaImage
        ref={imageRef}
        image={imageElement}
        x={image.x}
        y={image.y}
        width={image.width}
        height={image.height}
        rotation={image.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          })
        }}
        onTransformEnd={() => {
          const node = imageRef.current
          if (!node) return

          const scaleX = node.scaleX()
          const scaleY = node.scaleY()

          node.scaleX(1)
          node.scaleY(1)

          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            rotation: node.rotation(),
          })
        }}
      />
      {isSelected && <Transformer ref={transformerRef} />}
    </>
  )
}

// Sticker element component
function StickerElement({
  sticker,
  isSelected,
  onSelect,
  onChange,
}: {
  sticker: CanvasSticker
  isSelected: boolean
  onSelect: () => void
  onChange: (attrs: Partial<CanvasSticker>) => void
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const imageRef = useRef<Konva.Image>(null)
  const transformerRef = useRef<Konva.Transformer>(null)

  React.useEffect(() => {
    const img = new window.Image()
    img.src = sticker.imageUrl
    img.onload = () => setImage(img)
  }, [sticker.imageUrl])

  React.useEffect(() => {
    if (isSelected && imageRef.current && transformerRef.current) {
      transformerRef.current.nodes([imageRef.current])
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  if (!image) return null

  return (
    <>
      <KonvaImage
        ref={imageRef}
        image={image}
        x={sticker.x}
        y={sticker.y}
        width={sticker.width}
        height={sticker.height}
        rotation={sticker.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          })
        }}
        onTransformEnd={() => {
          const node = imageRef.current
          if (!node) return

          const scaleX = node.scaleX()
          const scaleY = node.scaleY()

          node.scaleX(1)
          node.scaleY(1)

          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            rotation: node.rotation(),
          })
        }}
      />
      {isSelected && <Transformer ref={transformerRef} />}
    </>
  )
}
