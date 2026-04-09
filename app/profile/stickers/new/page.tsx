'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { saveSticker, CustomSticker } from '@/lib/storage/local-storage'
import { ArrowLeft, Upload, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'

const STICKER_CATEGORIES = [
  '귀여움',
  '감성',
  '텍스트',
  '이모지',
  '도형',
  '기타'
]

export default function NewStickerPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('귀여움')
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      
      if (!file.type.startsWith('image/')) {
        toast.error('이미지 파일만 업로드 가능합니다')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('파일 크기는 5MB 이하로 업로드해주세요')
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        setImageSrc(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const createCroppedImage = async (): Promise<string> => {
    if (!imageSrc || !croppedAreaPixels) return ''

    const image = new Image()
    image.src = imageSrc

    return new Promise((resolve) => {
      image.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        canvas.width = croppedAreaPixels.width
        canvas.height = croppedAreaPixels.height

        ctx?.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        )

        resolve(canvas.toDataURL('image/png'))
      }
    })
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('스티커 이름을 입력해주세요')
      return
    }

    if (!imageSrc) {
      toast.error('이미지를 업로드해주세요')
      return
    }

    setIsSaving(true)

    try {
      const croppedImage = await createCroppedImage()

      const sticker: CustomSticker = {
        id: `sticker-${Date.now()}`,
        name: name.trim(),
        imageDataUrl: croppedImage,
        category,
        isFavorite: false,
        createdAt: new Date().toISOString()
      }

      saveSticker(sticker)
      toast.success('스티커가 등록되었습니다!')
      router.push('/profile/stickers')
    } catch (error) {
      toast.error('스티커 저장 중 오류가 발생했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b-2 border-foreground/10 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/profile/stickers">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold font-[var(--font-display)]">
            스티커 등록
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Upload Area */}
        {!imageSrc ? (
          <Card className="y2k-shadow">
            <CardContent className="p-8">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[300px]"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-10 h-10 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-bold mb-1">이미지 업로드</p>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG 파일 (최대 5MB)
                  </p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </CardContent>
          </Card>
        ) : (
          <Card className="y2k-shadow">
            <CardContent className="p-0">
              <div className="relative h-[400px] bg-muted">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <div className="p-4">
                <Label className="text-sm mb-2 block">확대/축소</Label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card className="y2k-shadow">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="name">스티커 이름</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 귀여운 하트"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="category">카테고리</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STICKER_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          {imageSrc && (
            <Button
              variant="outline"
              onClick={() => setImageSrc(null)}
              className="flex-1 border-2"
            >
              다시 선택
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!imageSrc || !name.trim() || isSaving}
            className="flex-1 y2k-shadow"
          >
            {isSaving ? '저장 중...' : '저장하기'}
          </Button>
        </div>
      </main>
    </div>
  )
}
