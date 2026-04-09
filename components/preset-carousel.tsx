'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { PresetCard } from './preset-card'
import type { Preset } from '@/lib/data/presets'
import { useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'

interface PresetCarouselProps {
  presets: Preset[]
  badge?: string
}

export function PresetCarousel({ presets, badge }: PresetCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    align: 'start',
    slidesToScroll: 1,
  })

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {presets.map((preset) => (
            <div key={preset.id} className="flex-[0_0_45%] min-w-0">
              <PresetCard
                id={preset.id}
                name={preset.name}
                thumbnailUrl={preset.thumbnailUrl}
                badge={badge}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 backdrop-blur-sm border-2 border-foreground/10"
        onClick={scrollPrev}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 backdrop-blur-sm border-2 border-foreground/10"
        onClick={scrollNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
