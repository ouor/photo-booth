'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ImageIcon, Home, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    href: '/',
    label: '메인',
    icon: Home,
    isActive: (pathname: string) => pathname === '/',
  },
  {
    href: '/frames',
    label: '프레임',
    icon: ImageIcon,
    isActive: (pathname: string) => pathname.startsWith('/frames'),
  },
  {
    href: '/profile',
    label: '마이페이지',
    icon: UserCircle,
    isActive: (pathname: string) => pathname.startsWith('/profile'),
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-foreground/10 bg-background/95 backdrop-blur-md">
      <div className="mx-auto grid max-w-4xl grid-cols-3 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = item.isActive(pathname)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-sm font-bold transition-all',
                active
                  ? 'bg-primary text-primary-foreground y2k-shadow'
                  : 'text-muted-foreground hover:bg-card hover:text-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[13px] leading-none">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
