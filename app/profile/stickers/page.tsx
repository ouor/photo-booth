'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import {
  getCustomStickers,
  deleteSticker,
  toggleStickerFavorite,
  CustomSticker
} from '@/lib/storage/local-storage'
import { ArrowLeft, Plus, Search, MoreVertical, Trash2, Heart, Edit } from 'lucide-react'
import { Empty } from '@/components/ui/empty'
import { toast } from 'sonner'

export default function MyStickersPage() {
  const router = useRouter()
  const [stickers, setStickers] = useState<CustomSticker[]>([])
  const [filteredStickers, setFilteredStickers] = useState<CustomSticker[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    loadStickers()
  }, [router])

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredStickers(
        stickers.filter(s =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    } else {
      setFilteredStickers(stickers)
    }
  }, [searchQuery, stickers])

  const loadStickers = () => {
    const customStickers = getCustomStickers()
    setStickers(customStickers.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ))
  }

  const handleToggleFavorite = (id: string) => {
    toggleStickerFavorite(id)
    loadStickers()
  }

  const handleDelete = (id: string) => {
    deleteSticker(id)
    loadStickers()
    setDeleteTarget(null)
    toast.success('스티커가 삭제되었습니다')
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
            내 스티커
          </h1>
          <Link href="/profile/stickers/new">
            <Button size="icon" className="rounded-full y2k-shadow">
              <Plus className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Search */}
        {stickers.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="스티커 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-2"
            />
          </div>
        )}

        {/* Sticker Grid */}
        {filteredStickers.length === 0 ? (
          <Empty
            icon={<Edit className="w-12 h-12" />}
            title={searchQuery ? '검색 결과가 없습니다' : '스티커가 없습니다'}
            description={searchQuery ? '다른 검색어를 시도해보세요' : '나만의 스티커를 등록해보세요'}
          >
            {!searchQuery && (
              <Link href="/profile/stickers/new">
                <Button className="mt-4">스티커 등록하기</Button>
              </Link>
            )}
          </Empty>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filteredStickers.map((sticker) => (
              <Card key={sticker.id} className="overflow-hidden y2k-shadow">
                <CardContent className="p-0">
                  {/* Sticker Image */}
                  <div className="aspect-square relative bg-muted flex items-center justify-center p-4">
                    <Image
                      src={sticker.imageDataUrl}
                      alt={sticker.name}
                      width={100}
                      height={100}
                      className="object-contain max-w-full max-h-full"
                    />
                    
                    {/* Favorite Badge */}
                    {sticker.isFavorite && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive flex items-center justify-center">
                        <Heart className="w-3 h-3 text-destructive-foreground fill-current" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate mb-1">
                          {sticker.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {sticker.category}
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
                            onClick={() => handleToggleFavorite(sticker.id)}
                            className="gap-2"
                          >
                            <Heart className={`w-4 h-4 ${sticker.isFavorite ? 'fill-current' : ''}`} />
                            {sticker.isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(sticker.id)}
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
            <AlertDialogTitle>스티커를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제된 스티커는 복구할 수 없습니다.
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
