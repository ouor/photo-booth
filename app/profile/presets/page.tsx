'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PresetCard } from '@/components/preset-card'
import { getCurrentUser } from '@/lib/auth/mock-auth'
import { getUserPresets, deleteUserPreset, UserPreset } from '@/lib/storage/local-storage'
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
import { ArrowLeft, Plus, Sparkles } from 'lucide-react'
import { Empty } from '@/components/ui/empty'
import { toast } from 'sonner'

export default function MyPresetsPage() {
  const router = useRouter()
  const [presets, setPresets] = useState<UserPreset[]>([])
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    loadPresets()
  }, [router])

  const loadPresets = () => {
    const userPresets = getUserPresets()
    setPresets(userPresets.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ))
  }

  const handleDelete = (id: string) => {
    deleteUserPreset(id)
    loadPresets()
    setDeleteTarget(null)
    toast.success('프리셋이 삭제되었습니다')
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b-2 border-foreground/10 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold font-[var(--font-display)] flex-1">
            내 프리셋
          </h1>
          <Link href="/profile/presets/new">
            <Button size="icon" className="rounded-full y2k-shadow">
              <Plus className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {presets.length === 0 ? (
          <Empty
            icon={<Sparkles className="w-12 h-12" />}
            title="프리셋이 없습니다"
            description="나만의 프리셋을 만들어 다른 사용자들과 공유해보세요"
          >
            <Link href="/profile/presets/new">
              <Button className="mt-4">프리셋 만들기</Button>
            </Link>
          </Empty>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {presets.map((preset) => (
              <PresetCard
                key={preset.id}
                id={preset.id}
                name={preset.name}
                thumbnailUrl={preset.thumbnailUrl}
                badge={preset.isPublic ? '공개' : '비공개'}
              />
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>프리셋을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제된 프리셋은 복구할 수 없으며, 다른 사용자들도 더 이상 사용할 수 없게 됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
