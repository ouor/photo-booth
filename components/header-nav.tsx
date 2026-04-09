'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getCurrentUser, User } from '@/lib/auth/mock-auth'
import { UserCircle } from 'lucide-react'

export function HeaderNav() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  return (
    <div className="flex items-center gap-2">
      {user ? (
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-primary/10 text-xs font-bold">
                {user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </Link>
      ) : (
        <Link href="/login">
          <Button variant="ghost" size="icon" className="rounded-full">
            <UserCircle className="w-6 h-6" />
          </Button>
        </Link>
      )}
    </div>
  )
}
