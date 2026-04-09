'use client'

import { useState, useMemo } from 'react'
import { SectionHeader } from '@/components/section-header'
import { PresetCard } from '@/components/preset-card'
import { PresetCarousel } from '@/components/preset-carousel'
import { SearchBar } from '@/components/search-bar'
import { CategoryFilter } from '@/components/category-filter'
import { mockPresets } from '@/lib/data/presets'
import { Sparkles } from 'lucide-react'

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(mockPresets.map(p => p.category))
    return Array.from(cats)
  }, [])

  // Filter presets based on search and category
  const filteredPresets = useMemo(() => {
    return mockPresets.filter(preset => {
      const matchesSearch = searchQuery === '' || 
        preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = selectedCategory === null || preset.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  const featuredPresets = mockPresets.slice(0, 4)
  const popularPresets = filteredPresets.filter(p => p.tags.includes('감성')).slice(0, 4)

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b-2 border-foreground/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-center font-[var(--font-display)]">
              Photo Booth
            </h1>
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <p className="text-center text-sm text-muted-foreground mt-1 font-[var(--font-display)]">
            나만의 감성 사진 만들기
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-10">
        {/* Featured Carousel */}
        <section>
          <SectionHeader>✨ 추천 프리셋 ✨</SectionHeader>
          <div className="mt-6">
            <PresetCarousel presets={featuredPresets} badge="추천" />
          </div>
        </section>

        {/* Search and Filter */}
        <section className="space-y-4">
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery}
            placeholder="프리셋 이름이나 태그로 검색..."
          />
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </section>

        {/* Popular Presets */}
        {popularPresets.length > 0 && (
          <section>
            <SectionHeader>💖 인기 프리셋 💖</SectionHeader>
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
        )}

        {/* All Filtered Presets */}
        <section>
          <SectionHeader>
            {selectedCategory ? `🎨 ${selectedCategory} 프리셋` : '🌸 모든 프리셋'}
          </SectionHeader>
          <div className="grid grid-cols-2 gap-4 mt-6">
            {filteredPresets.map((preset) => (
              <PresetCard
                key={preset.id}
                id={preset.id}
                name={preset.name}
                thumbnailUrl={preset.thumbnailUrl}
              />
            ))}
          </div>
          {filteredPresets.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground font-[var(--font-display)]">
                검색 결과가 없습니다
              </p>
            </div>
          )}
        </section>

        {/* Bottom Spacing */}
        <div className="h-8" />
      </main>
    </div>
  )
}
