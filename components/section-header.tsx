import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  children: React.ReactNode
  className?: string
}

export function SectionHeader({ children, className }: SectionHeaderProps) {
  return (
    <h2 
      className={cn(
        "text-2xl md:text-3xl font-bold text-center",
        "font-[var(--font-handwriting)]",
        "text-foreground tracking-wide",
        "mb-4",
        className
      )}
    >
      {children}
    </h2>
  )
}
