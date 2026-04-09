import Link from 'next/link'
import { Home, Sparkles, Search } from 'lucide-react'
import { RoundButton } from '@/components/round-button'
import { SectionHeader } from '@/components/section-header'
import { PresetCard } from '@/components/preset-card'
import { mockPresets } from '@/lib/data/presets'

export default function NotFound() {
  const popularPresets = mockPresets.slice(0, 4)

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b-2 border-foreground/10 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-center font-[var(--font-display)]">
              Photo Booth
            </h1>
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* 404 Message */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <div className="inline-block bg-card rounded-2xl p-8 border-2 border-foreground/10 y2k-shadow">
              <div className="text-8xl font-bold font-[var(--font-display)] text-primary mb-4">
                404
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Search className="w-6 h-6 text-muted-foreground" />
                <h2 className="text-2xl font-bold font-[var(--font-display)]">
                  페이지를 찾을 수 없어요
                </h2>
              </div>
              <p className="text-muted-foreground">
                찾으시는 페이지가 존재하지 않거나 이동했을 수 있어요
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/">
              <RoundButton>
                <Home className="w-4 h-4 mr-2 inline" />
                홈으로 가기
              </RoundButton>
            </Link>
            <Link href="/">
              <RoundButton variant="outline">
                <Sparkles className="w-4 h-4 mr-2 inline" />
                프리셋 둘러보기
              </RoundButton>
            </Link>
          </div>
        </div>

        {/* Popular Presets */}
        <section>
          <SectionHeader>인기 프리셋</SectionHeader>
          <div className="grid grid-cols-2 gap-4 mt-6">
            {popularPresets.map((preset) => (
              <PresetCard
                key={preset.id}
                id={preset.id}
                name={preset.name}
                thumbnailUrl={preset.thumbnailUrl}
                badge="인기"
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
