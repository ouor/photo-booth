'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { getCurrentUser } from '@/lib/auth/mock-auth'
import { getSavedWorks, deleteWork, SavedWork } from '@/lib/storage/local-storage'
import { ArrowLeft, MoreVertical, Download, Trash2, Edit, Image as ImageIcon } from 'lucide-react'
import { Empty } from '@/components/ui/empty'
import { toast } from 'sonner'
import Image from 'next/image'

export default function MyWorksPage() {
  const router = useRouter()
  const [works, setWorks] = useState<SavedWork[]>([])
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    loadWorks()
  }, [router])

  const loadWorks = () => {
    const savedWorks = getSavedWorks()
    setWorks(savedWorks.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ))
  }

  const handleDownload = (work: SavedWork) => {
    const link = document.createElement('a')
    link.href = work.imageDataUrl
    link.download = `photo-booth-${work.id}.png`
    link.click()
    toast.success('다운로드 완료!')
  }

  const handleDelete = (id: string) => {
    deleteWork(id)
    loadWorks()
    setDeleteTarget(null)
    toast.success('작업물이 삭제되었습니다')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
          <h1 className="text-2xl font-bold font-[var(--font-display)]">
            내 작업물
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {works.length === 0 ? (
          <Empty
            icon={<ImageIcon className="w-12 h-12" />}
            title="작업물이 없습니다"
            description="프리셋을 선택해서 첫 작업물을 만들어보세요"
          >
            <Link href="/">
              <Button className="mt-4">프리셋 둘러보기</Button>
            </Link>
          </Empty>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {works.map((work) => (
              <Card key={work.id} className="overflow-hidden y2k-shadow">
                <CardContent className="p-0">
                  {/* Thumbnail */}
                  <div className="aspect-[3/4] relative bg-muted">
                    <Image
                      src={work.thumbnailUrl || work.imageDataUrl}
                      alt={work.presetName}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate">
                          {work.presetName}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(work.createdAt)}
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -mr-2"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDownload(work)}
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            다운로드
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/preset/${work.presetId}/create`)}
                            className="gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            재편집
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(work.id)}
                            className="gap-2 text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>작업물을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제된 작업물은 복구할 수 없습니다.
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
