import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface PresetCardProps {
  id: string
  name: string
  thumbnailUrl: string
  badge?: string
  className?: string
}

export function PresetCard({ id, name, thumbnailUrl, badge, className }: PresetCardProps) {
  return (
    <Link href={`/preset/${id}`} className={cn("block group", className)}>
      <div className="relative overflow-hidden rounded-2xl bg-card border-2 border-foreground/10 shadow-lg transition-all hover:scale-105 hover:shadow-xl">
        {/* Thumbnail */}
        <div className="aspect-[3/4] relative">
          <Image
            src={thumbnailUrl}
            alt={name}
            fill
            className="object-cover"
          />
        </div>
        
        {/* Badge */}
        {badge && (
          <div className="absolute top-3 right-3">
            <span className="inline-block bg-white px-3 py-1 rounded-full text-xs font-bold border-2 border-foreground shadow-md">
              {badge}
            </span>
          </div>
        )}
        
        {/* Name Label */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-3 border-t-2 border-foreground/10">
          <p className="text-center font-bold text-sm line-clamp-1">{name}</p>
        </div>
      </div>
    </Link>
  )
}
