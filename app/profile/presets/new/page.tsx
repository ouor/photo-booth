'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Stage, Layer, Rect, Image as KonvaImage } from 'react-konva'
import Konva from 'konva'
import { saveUserPreset, UserPreset } from '@/lib/storage/local-storage'
import { getCurrentUser } from '@/lib/auth/mock-auth'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES = ['계절', '스타일', '이벤트', '감성', '기타']
const PRESET_COLORS = [
  '#FFB6C1', '#FFE4E1', '#FFF0F5', '#E0BBE4', '#D4A5A5',
  '#B4E7CE', '#C9E4CA', '#FFE5CC', '#FFD4B2', '#D4E4F7'
]

export default function NewPresetPage() {
  const router = useRouter()
  const stageRef = useRef<Konva.Stage>(null)
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('스타일')
  const [tags, setTags] = useState('')
  const [backgroundColor, setBackgroundColor] = useState('#FFB6C1')
  const [isSaving, setIsSaving] = useState(false)

  const canvasWidth = 800
  const canvasHeight = 1200

  const handleSave = async () => {
    const user = getCurrentUser()
    if (!user) {
      router.push('/login')
      return
    }

    if (!name.trim()) {
      toast.error('프리셋 이름을 입력해주세요')
      return
    }

    setIsSaving(true)

    try {
      // Generate thumbnail from canvas
      const stage = stageRef.current
      if (!stage) throw new Error('Canvas not found')

      const thumbnailUrl = stage.toDataURL({ pixelRatio: 0.2 })

      const preset: UserPreset = {
        id: `preset-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        thumbnailUrl,
        category,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        layout: {
          width: canvasWidth,
          height: canvasHeight,
          backgroundColor
        },
        isPublic: true, // Auto-publish as decided
        createdAt: new Date().toISOString(),
        authorId: user.id
      }

      saveUserPreset(preset)
      toast.success('프리셋이 생성되었습니다!')
      router.push('/profile/presets')
    } catch (error) {
      toast.error('프리셋 저장 중 오류가 발생했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b-2 border-foreground/10 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/profile/presets">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold font-[var(--font-display)] flex-1">
            프리셋 만들기
          </h1>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 y2k-shadow"
          >
            <Save className="w-5 h-5" />
            {isSaving ? '저장 중...' : '발행하기'}
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Canvas */}
          <div>
            <Card className="y2k-shadow overflow-hidden">
              <CardContent className="p-4">
                <div className="bg-white rounded-lg overflow-hidden">
                  <Stage
                    ref={stageRef}
                    width={canvasWidth}
                    height={canvasHeight}
                    style={{
                      width: '100%',
                      height: 'auto',
                      aspectRatio: `${canvasWidth} / ${canvasHeight}`
                    }}
                  >
                    <Layer>
                      <Rect
                        x={0}
                        y={0}
                        width={canvasWidth}
                        height={canvasHeight}
                        fill={backgroundColor}
                      />
                    </Layer>
                  </Stage>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings */}
          <div className="space-y-6">
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">기본 정보</TabsTrigger>
                <TabsTrigger value="design">디자인</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <Card className="y2k-shadow">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label htmlFor="name">프리셋 이름 *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="예: 벚꽃 감성"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">설명</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="프리셋에 대한 설명을 입력하세요"
                        className="mt-2"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">카테고리</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
                      <Input
                        id="tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="예: 봄, 핑크, 파스텔"
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="design" className="space-y-4 mt-4">
                <Card className="y2k-shadow">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label>배경 색상</Label>
                      <div className="grid grid-cols-5 gap-3 mt-3">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setBackgroundColor(color)}
                            className={`w-full aspect-square rounded-lg border-2 transition-all ${
                              backgroundColor === color
                                ? 'border-foreground scale-110'
                                : 'border-transparent hover:border-muted-foreground'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      
                      <div className="mt-4">
                        <Label htmlFor="custom-color" className="text-sm">
                          커스텀 색상
                        </Label>
                        <Input
                          id="custom-color"
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="mt-2 h-12"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        캔버스 크기: {canvasWidth} x {canvasHeight}px
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        사용자는 자유롭게 사진을 배치할 수 있습니다
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Info Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>안내:</strong> 프리셋은 발행 즉시 다른 사용자들도 사용할 수 있습니다. 
                  부적절한 콘텐츠는 신고를 통해 관리됩니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
