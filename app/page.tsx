import { SectionHeader } from '@/components/section-header'
import { PresetCard } from '@/components/preset-card'
import { RoundButton } from '@/components/round-button'
import { ActionButton } from '@/components/action-button'
import { mockPresets } from '@/lib/data/presets'
import { Camera, Sparkles, Image as ImageIcon } from 'lucide-react'

export default function Home() {
  const popularPresets = mockPresets.slice(0, 4)
  const recentPresets = mockPresets.slice(4, 6)

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b-2 border-foreground/10 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center font-[var(--font-display)]">
            Photo Booth
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {/* Action Buttons */}
        <section className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          <ActionButton icon={<Sparkles />} label="사진" />
          <ActionButton icon={<Camera />} label="꾸미기" />
          <ActionButton icon={<ImageIcon />} label="카메라" />
        </section>

        {/* Popular Presets */}
        <section>
          <SectionHeader>✨ 인기 프리셋 ✨</SectionHeader>
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

        {/* Recent Presets */}
        <section>
          <SectionHeader>🌸 최신 프리셋 🌸</SectionHeader>
          <div className="grid grid-cols-2 gap-4 mt-6">
            {recentPresets.map((preset) => (
              <PresetCard
                key={preset.id}
                id={preset.id}
                name={preset.name}
                thumbnailUrl={preset.thumbnailUrl}
                badge="NEW"
              />
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8">
          <p className="text-lg mb-4 font-[var(--font-display)]">
            나만의 감성 사진을 만들어보세요
          </p>
          <RoundButton>모든 프리셋 보기</RoundButton>
        </section>
      </main>
    </div>
  )
}
