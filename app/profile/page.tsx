'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getCurrentUser, logout, User } from '@/lib/auth/mock-auth'
import { getSavedWorks, getCustomStickers, getUserPresets } from '@/lib/storage/local-storage'
import { Settings, LogOut, Image, Sticker, Sparkles, Heart, ArrowRight } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState({
    works: 0,
    stickers: 0,
    presets: 0,
    saved: 0
  })

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    setUser(currentUser)

    // Load stats
    setStats({
      works: getSavedWorks().length,
      stickers: getCustomStickers().length,
      presets: getUserPresets().length,
      saved: 0 // Saved presets feature not implemented yet
    })
  }, [router])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!user) {
    return null
  }

  const initials = user.name.substring(0, 2).toUpperCase()

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b-2 border-foreground/10 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold font-[var(--font-display)]">
            마이페이지
          </h1>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Section */}
        <Card className="y2k-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border-2 border-foreground">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-2xl font-bold bg-primary/10">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold font-[var(--font-display)] mb-1">
                  {user.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.works}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  작업물
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.stickers}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  스티커
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.presets}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  프리셋
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Cards */}
        <div className="space-y-4">
          <Link href="/profile/works">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer y2k-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Image className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">내 작업물</CardTitle>
                    <CardDescription>
                      제작한 사진 {stats.works}개
                    </CardDescription>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/profile/stickers">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer y2k-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Sticker className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">내 스티커</CardTitle>
                    <CardDescription>
                      등록한 스티커 {stats.stickers}개
                    </CardDescription>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/profile/presets">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer y2k-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">내 프리셋</CardTitle>
                    <CardDescription>
                      만든 프리셋 {stats.presets}개
                    </CardDescription>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Card className="hover:bg-muted/50 transition-colors cursor-pointer y2k-shadow opacity-50">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">저장한 프리셋</CardTitle>
                  <CardDescription>
                    즐겨찾기 {stats.saved}개
                  </CardDescription>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full h-12 gap-2 border-2"
        >
          <LogOut className="w-5 h-5" />
          로그아웃
        </Button>
      </main>
    </div>
  )
}
