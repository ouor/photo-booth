'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, Heart, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PresetCard } from '@/components/preset-card'
import { SectionHeader } from '@/components/section-header'
import { Empty } from '@/components/ui/empty'
import { mockPresets } from '@/lib/data/presets'
import { getSavedPresets, toggleSavePreset } from '@/lib/storage/local-storage'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function SavedPresetsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent')
  const [presetToUnsave, setPresetToUnsave] = useState<string | null>(null)

  const savedPresetIds = getSavedPresets()
  const savedPresets = mockPresets.filter((p) => savedPresetIds.includes(p.id))

  // Filter and sort
  const filteredPresets = useMemo(() => {
    let results = savedPresets

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      results = results.filter(
        (preset) =>
          preset.name.toLowerCase().includes(query) ||
          preset.description.toLowerCase().includes(query)
      )
    }

    // Sort
    if (sortBy === 'name') {
      results = [...results].sort((a, b) => a.name.localeCompare(b.name))
    }
    // 'recent' keeps the default order from savedPresetIds

    return results
  }, [savedPresets, searchQuery, sortBy])

  const handleUnsave = (presetId: string) => {
    toggleSavePreset(presetId)
    setPresetToUnsave(null)
    toast.success('저장 해제됨', {
      description: '프리셋이 저장 목록에서 제거되었습니다.',
    })
    router.refresh()
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b-2 border-foreground/10 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/profile" className="p-2 hover:bg-muted rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold font-[var(--font-display)]">
              저장한 프리셋
            </h1>
          </div>

          {/* Search and Sort */}
          {savedPresets.length > 0 && (
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="프리셋 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'recent' | 'name')}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">최신순</SelectItem>
                  <SelectItem value="name">이름순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {savedPresets.length === 0 ? (
          <div className="py-20">
            <Empty
              icon={<Heart className="w-16 h-16" />}
              title="저장한 프리셋이 없어요"
              description="마음에 드는 프리셋을 찾아 저장해보세요!"
            />
            <div className="text-center mt-8">
              <Link href="/">
                <Button className="bg-primary hover:bg-primary/90">
                  <Sparkles className="w-4 h-4 mr-2" />
                  프리셋 둘러보기
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {filteredPresets.length === 0 ? (
              <div className="py-20">
                <Empty
                  icon={<Search className="w-16 h-16" />}
                  title="검색 결과가 없어요"
                  description="다른 키워드로 검색해보세요"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredPresets.map((preset) => (
                  <div key={preset.id} className="relative group">
                    <PresetCard
                      id={preset.id}
                      name={preset.name}
                      thumbnailUrl={preset.thumbnailUrl}
                    />
                    <button
                      onClick={() => setPresetToUnsave(preset.id)}
                      className="absolute top-4 right-4 p-2 bg-white/90 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="저장 해제"
                    >
                      <Heart className="w-5 h-5 text-primary fill-primary" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Unsave Confirmation Dialog */}
      <AlertDialog open={!!presetToUnsave} onOpenChange={() => setPresetToUnsave(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>저장을 해제하시겠어요?</AlertDialogTitle>
            <AlertDialogDescription>
              이 프리셋을 저장 목록에서 제거합니다. 언제든지 다시 저장할 수 있어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => presetToUnsave && handleUnsave(presetToUnsave)}>
              해제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
