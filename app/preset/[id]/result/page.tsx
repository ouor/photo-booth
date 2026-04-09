'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Download, Edit, Home, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RoundButton } from '@/components/round-button'
import { PresetCard } from '@/components/preset-card'
import { SectionHeader } from '@/components/section-header'
import { mockPresets } from '@/lib/data/presets'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { saveWork } from '@/lib/storage/local-storage'
import { getCurrentUser } from '@/lib/auth/mock-auth'

interface ResultPageProps {
  params: Promise<{ id: string }>
}

export default function ResultPage({ params }: ResultPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const unwrappedParams = React.use(params)
  const [imageData, setImageData] = useState<string | null>(null)
  const [format, setFormat] = useState<'png' | 'jpg'>('png')
  const [isSaving, setIsSaving] = useState(false)

  const preset = mockPresets.find((p) => p.id === unwrappedParams.id)
  const relatedPresets = mockPresets.filter((p) => p.id !== unwrappedParams.id).slice(0, 4)

  useEffect(() => {
    // Get image data from URL params or localStorage
    const dataUrl = searchParams.get('image')
    if (dataUrl) {
      setImageData(decodeURIComponent(dataUrl))
    } else {
      // Try to get from localStorage
      const stored = localStorage.getItem('lastCreatedImage')
      if (stored) {
        setImageData(stored)
      }
    }
  }, [searchParams])

  const handleDownload = () => {
    if (!imageData) return

    const link = document.createElement('a')
    link.download = `photo-booth-${Date.now()}.${format}`
    link.href = imageData
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('다운로드 완료!', {
      description: '사진이 저장되었습니다.',
    })
  }

  const handleSaveToWorks = async () => {
    if (!imageData || !preset) return

    const user = getCurrentUser()
    if (!user) {
      toast.error('로그인이 필요합니다', {
        description: '작업물을 저장하려면 로그인해주세요.',
      })
      return
    }

    setIsSaving(true)

    try {
      saveWork({
        id: `work-${Date.now()}`,
        presetId: preset.id,
        presetName: preset.name,
        imageDataUrl: imageData,
        thumbnailUrl: imageData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      toast.success('저장 완료!', {
        description: '내 작업물에 저장되었습니다.',
      })
    } catch {
      toast.error('저장 실패', {
        description: '다시 시도해주세요.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!imageData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">이미지를 불러올 수 없습니다</p>
          <Link href="/">
            <RoundButton>홈으로 가기</RoundButton>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b-2 border-foreground/10 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-center font-[var(--font-display)]">
              완성!
            </h1>
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Result Image */}
        <section className="bg-card rounded-2xl p-4 border-2 border-foreground/10 y2k-shadow">
          <div className="aspect-[2/3] relative rounded-xl overflow-hidden bg-muted">
            <img
              src={imageData}
              alt="완성된 작품"
              className="w-full h-full object-contain"
            />
          </div>
          {preset && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              {preset.name} 프리셋 사용
            </p>
          )}
        </section>

        {/* Actions */}
        <section className="bg-card rounded-2xl p-6 border-2 border-foreground/10 y2k-shadow space-y-4">
          <h2 className="text-lg font-bold font-[var(--font-display)]">
            저장하기
          </h2>

          <div className="flex gap-3">
            <Select value={format} onValueChange={(v) => setFormat(v as 'png' | 'jpg')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpg">JPG</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleDownload} className="flex-1 bg-primary hover:bg-primary/90">
              <Download className="w-4 h-4 mr-2" />
              다운로드
            </Button>
          </div>

          {getCurrentUser() && (
            <Button
              onClick={handleSaveToWorks}
              disabled={isSaving}
              variant="outline"
              className="w-full"
            >
              내 작업물에 저장
            </Button>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Link href={`/preset/${unwrappedParams.id}/create`} className="block">
              <Button variant="outline" className="w-full">
                <Edit className="w-4 h-4 mr-2" />
                다시 편집
              </Button>
            </Link>
            <Link href={`/preset/${unwrappedParams.id}`} className="block">
              <Button variant="outline" className="w-full">
                새로 만들기
              </Button>
            </Link>
          </div>
        </section>

        {/* Related Presets */}
        {relatedPresets.length > 0 && (
          <section>
            <SectionHeader>다른 프리셋도 만들어볼까요?</SectionHeader>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {relatedPresets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  id={preset.id}
                  name={preset.name}
                  thumbnailUrl={preset.thumbnailUrl}
                />
              ))}
            </div>
          </section>
        )}

        {/* Home Button */}
        <section className="text-center">
          <Link href="/">
            <RoundButton>
              <Home className="w-4 h-4 mr-2 inline" />
              홈으로 가기
            </RoundButton>
          </Link>
        </section>
      </main>
    </div>
  )
}
