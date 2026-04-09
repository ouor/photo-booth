'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Bell, Globe, Trash2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getCurrentUser, logout } from '@/lib/auth/mock-auth'
import { toast } from 'sonner'

export default function SettingsPage() {
  const router = useRouter()
  const user = getCurrentUser()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const [name, setName] = useState(user?.name || '')
  const [notifications, setNotifications] = useState(true)
  const [language, setLanguage] = useState('ko')

  const handleSaveProfile = () => {
    // In real app, this would update the user profile
    toast.success('프로필 저장됨', {
      description: '프로필 정보가 업데이트되었습니다.',
    })
  }

  const handleClearCache = () => {
    // Clear some localStorage except user data
    const keysToKeep = ['currentUser', 'mockUsers']
    const allKeys = Object.keys(localStorage)
    allKeys.forEach((key) => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key)
      }
    })
    toast.success('캐시 삭제 완료', {
      description: '임시 데이터가 삭제되었습니다.',
    })
  }

  const handleLogout = () => {
    logout()
    toast.success('로그아웃 완료')
    router.push('/login')
  }

  const handleDeleteAccount = () => {
    // In real app, this would delete the user account
    logout()
    toast.success('계정 삭제 완료')
    router.push('/')
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b-2 border-foreground/10 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/profile" className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold font-[var(--font-display)]">
            설정
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Section */}
        <section className="bg-card rounded-2xl p-6 border-2 border-foreground/10 y2k-shadow space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold font-[var(--font-display)]">
              프로필
            </h2>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">
              사진 변경
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              이메일은 변경할 수 없습니다
            </p>
          </div>

          <Button onClick={handleSaveProfile} className="w-full bg-primary hover:bg-primary/90">
            저장
          </Button>
        </section>

        {/* Notifications Section */}
        <section className="bg-card rounded-2xl p-6 border-2 border-foreground/10 y2k-shadow space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold font-[var(--font-display)]">
              알림
            </h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications">새 프리셋 알림</Label>
              <p className="text-sm text-muted-foreground">
                새로운 프리셋이 추가되면 알림을 받습니다
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
        </section>

        {/* Language Section */}
        <section className="bg-card rounded-2xl p-6 border-2 border-foreground/10 y2k-shadow space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold font-[var(--font-display)]">
              언어
            </h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">언어 설정</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ko">한국어</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Data Management Section */}
        <section className="bg-card rounded-2xl p-6 border-2 border-foreground/10 y2k-shadow space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold font-[var(--font-display)]">
              데이터 관리
            </h2>
          </div>

          <Button onClick={handleClearCache} variant="outline" className="w-full">
            캐시 삭제
          </Button>
          <p className="text-xs text-muted-foreground">
            임시 파일과 캐시를 삭제합니다. 작업물과 스티커는 유지됩니다.
          </p>
        </section>

        {/* Account Actions Section */}
        <section className="bg-card rounded-2xl p-6 border-2 border-foreground/10 y2k-shadow space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <LogOut className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold font-[var(--font-display)]">
              계정
            </h2>
          </div>

          <Button
            onClick={() => setShowLogoutDialog(true)}
            variant="outline"
            className="w-full"
          >
            로그아웃
          </Button>

          <div className="pt-4 border-t">
            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="destructive"
              className="w-full"
            >
              계정 삭제
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다
            </p>
          </div>
        </section>

        {/* Version Info */}
        <div className="text-center text-sm text-muted-foreground">
          Photo Booth v1.0.0
        </div>
      </main>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>로그아웃하시겠어요?</AlertDialogTitle>
            <AlertDialogDescription>
              다시 로그인하여 작업물과 스티커를 확인할 수 있어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>로그아웃</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 계정을 삭제하시겠어요?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 모든 작업물, 스티커, 프리셋이 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
