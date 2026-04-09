import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { mockPresets } from '@/lib/data/presets'
import { SectionHeader } from '@/components/section-header'
import { RoundButton } from '@/components/round-button'
import { PresetCard } from '@/components/preset-card'
import { ArrowLeft, Sparkles } from 'lucide-react'

interface PresetPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PresetPageProps) {
  const { id } = await params
  const preset = mockPresets.find((p) => p.id === id)
  
  if (!preset) {
    return {
      title: 'Preset Not Found',
    }
  }

  return {
    title: `${preset.name} - Photo Booth`,
    description: preset.description,
  }
}

export default async function PresetPage({ params }: PresetPageProps) {
  const { id } = await params
  const preset = mockPresets.find((p) => p.id === id)

  if (!preset) {
    notFound()
  }

  // Get similar presets (same category, excluding current)
  const similarPresets = mockPresets
    .filter((p) => p.category === preset.category && p.id !== preset.id)
    .slice(0, 4)

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b-2 border-foreground/10 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold font-[var(--font-display)]">
            {preset.name}
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Image */}
        <section className="relative aspect-[3/4] rounded-2xl overflow-hidden border-4 border-foreground/10 y2k-shadow">
          <Image
            src={preset.thumbnailUrl}
            alt={preset.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute top-4 right-4">
            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold text-sm y2k-shadow">
              {preset.category}
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="bg-card rounded-2xl p-6 border-2 border-foreground/10 y2k-shadow">
          <h2 className="text-xl font-bold mb-3 font-[var(--font-display)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            프리셋 소개
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {preset.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {preset.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-8 border-2 border-foreground/10 text-center y2k-shadow">
          <h3 className="text-2xl font-bold mb-3 font-[var(--font-display)]">
            이 프리셋으로 만들어보기
          </h3>
          <p className="text-muted-foreground mb-6">
            나만의 감성 사진을 꾸며보세요
          </p>
          <Link href={`/preset/${preset.id}/create`}>
            <RoundButton>
              시작하기
            </RoundButton>
          </Link>
        </section>

        {/* Similar Presets */}
        {similarPresets.length > 0 && (
          <section>
            <SectionHeader>비슷한 프리셋</SectionHeader>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {similarPresets.map((p) => (
                <PresetCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  thumbnailUrl={p.thumbnailUrl}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
