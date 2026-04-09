import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface RoundButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  children: React.ReactNode
}

export const RoundButton = forwardRef<HTMLButtonElement, RoundButtonProps>(
  ({ variant = 'primary', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "px-6 py-3 rounded-full font-bold text-sm transition-all",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "active:scale-95",
          {
            'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl':
              variant === 'primary',
            'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md':
              variant === 'secondary',
            'bg-transparent border-2 border-foreground text-foreground hover:bg-foreground hover:text-background':
              variant === 'outline',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

RoundButton.displayName = 'RoundButton'
