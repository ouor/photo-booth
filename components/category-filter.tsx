'use client'

import { Badge } from './ui/badge'
import { cn } from '@/lib/utils'

interface CategoryFilterProps {
  categories: string[]
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <Badge
        variant={selectedCategory === null ? 'default' : 'outline'}
        className={cn(
          'cursor-pointer px-4 py-2 text-sm font-bold rounded-full whitespace-nowrap transition-all',
          selectedCategory === null 
            ? 'bg-primary text-primary-foreground y2k-shadow' 
            : 'bg-white border-2 border-foreground/10 hover:border-primary'
        )}
        onClick={() => onSelectCategory(null)}
      >
        전체
      </Badge>
      {categories.map((category) => (
        <Badge
          key={category}
          variant={selectedCategory === category ? 'default' : 'outline'}
          className={cn(
            'cursor-pointer px-4 py-2 text-sm font-bold rounded-full whitespace-nowrap transition-all',
            selectedCategory === category 
              ? 'bg-primary text-primary-foreground y2k-shadow' 
              : 'bg-white border-2 border-foreground/10 hover:border-primary'
          )}
          onClick={() => onSelectCategory(category)}
        >
          {category}
        </Badge>
      ))}
    </div>
  )
}
