import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
  label: string
}

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ icon, label, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-2",
          "bg-secondary/50 backdrop-blur-sm rounded-3xl p-6",
          "border-2 border-foreground/10",
          "transition-all hover:scale-105 hover:bg-secondary/70",
          "min-w-[120px] aspect-square",
          "shadow-md hover:shadow-lg",
          className
        )}
        {...props}
      >
        {icon && <div className="text-3xl">{icon}</div>}
        <span className="text-sm font-bold text-center">{label}</span>
      </button>
    )
  }
)

ActionButton.displayName = 'ActionButton'
