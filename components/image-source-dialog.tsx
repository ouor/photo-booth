'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Clipboard, ImagePlus, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type CameraFacingMode = 'environment' | 'user'
type DialogMode = 'picker' | 'camera'

interface ImageSourceDialogProps {
  open: boolean
  slotLabel: string
  onOpenChange: (open: boolean) => void
  onRequestFileSelect: () => void
  onImageResolved: (imageUrl: string) => void
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

export function ImageSourceDialog({
  open,
  slotLabel,
  onOpenChange,
  onRequestFileSelect,
  onImageResolved,
}: ImageSourceDialogProps) {
  const [mode, setMode] = useState<DialogMode>('picker')
  const [cameraFacingMode, setCameraFacingMode] = useState<CameraFacingMode>('environment')
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const facingLabel = useMemo(
    () => (cameraFacingMode === 'environment' ? '후면 카메라' : '전면 카메라'),
    [cameraFacingMode],
  )

  useEffect(() => {
    if (!open) {
      setMode('picker')
      stopStream(streamRef.current)
      streamRef.current = null
      setCameraStream(null)
      return
    }

    if (mode !== 'camera') {
      stopStream(streamRef.current)
      streamRef.current = null
      setCameraStream(null)
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('이 브라우저에서는 카메라를 사용할 수 없어요.')
      setMode('picker')
      return
    }

    let isCancelled = false

    async function startCamera() {
      setIsStartingCamera(true)
      stopStream(streamRef.current)
      streamRef.current = null

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: cameraFacingMode },
          },
          audio: false,
        })

        if (isCancelled) {
          stopStream(stream)
          return
        }

        streamRef.current = stream
        setCameraStream(stream)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => undefined)
        }
      } catch {
        toast.error('카메라를 열 수 없어요. 권한을 확인해 주세요.')
        setMode('picker')
      } finally {
        if (!isCancelled) {
          setIsStartingCamera(false)
        }
      }
    }

    void startCamera()

    return () => {
      isCancelled = true
    }
  }, [cameraFacingMode, mode, open])

  useEffect(() => {
    return () => {
      stopStream(streamRef.current)
      streamRef.current = null
    }
  }, [])

  const handleClipboardRead = async () => {
    if (!navigator.clipboard?.read) {
      toast.error('이 브라우저에서는 클립보드 이미지 읽기를 지원하지 않아요.')
      return
    }

    try {
      const clipboardItems = await navigator.clipboard.read()

      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith('image/'))
        if (!imageType) {
          continue
        }

        const blob = await item.getType(imageType)
        const reader = new FileReader()
        reader.onload = (event) => {
          const result = event.target?.result
          if (typeof result !== 'string') {
            toast.error('클립보드 이미지를 읽지 못했어요.')
            return
          }

          onImageResolved(result)
          onOpenChange(false)
          toast.success('클립보드 이미지를 불러왔어요.')
        }
        reader.readAsDataURL(blob)
        return
      }

      toast.error('클립보드에 이미지가 없어요.')
    } catch {
      toast.error('클립보드 접근 권한을 확인해 주세요.')
    }
  }

  const handleCameraCapture = () => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('카메라 화면을 아직 불러오는 중이에요.')
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      toast.error('카메라 캡처를 준비하지 못했어요.')
      return
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    onImageResolved(canvas.toDataURL('image/png'))
    onOpenChange(false)
    toast.success('사진을 캡처했어요.')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-[2rem] border-2 border-foreground/10 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="font-[var(--font-display)] text-2xl">
            {slotLabel} 채우기
          </DialogTitle>
          <DialogDescription>
            파일 선택, 카메라 촬영, 클립보드 붙여넣기 중 원하는 입력 방법을 선택해 주세요.
          </DialogDescription>
        </DialogHeader>

        {mode === 'camera' ? (
          <div className="space-y-4 px-6 pb-6">
            <button
              type="button"
              onClick={handleCameraCapture}
              className="group relative block w-full overflow-hidden rounded-[1.5rem] border-2 border-foreground/10 bg-black"
            >
              <video
                ref={videoRef}
                muted
                playsInline
                className="aspect-[3/4] w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 via-black/20 to-transparent px-4 py-4 text-white">
                <span className="text-sm">
                  {isStartingCamera ? '카메라를 준비하는 중...' : '화면을 다시 누르면 촬영돼요'}
                </span>
                <span className="rounded-full border border-white/40 px-3 py-1 text-xs">
                  Capture
                </span>
              </div>
            </button>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setCameraFacingMode((current) =>
                    current === 'environment' ? 'user' : 'environment',
                  )
                }
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                {facingLabel} 전환
              </Button>
              <Button type="button" variant="ghost" onClick={() => setMode('picker')}>
                다른 방식 선택
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 px-6 pb-6 sm:grid-cols-3">
            <button
              type="button"
              onClick={onRequestFileSelect}
              className="rounded-[1.5rem] border-2 border-foreground/10 bg-card p-5 text-left transition-transform hover:-translate-y-0.5 hover:border-primary"
            >
              <ImagePlus className="mb-4 h-8 w-8 text-primary" />
              <strong className="block font-[var(--font-display)] text-xl">파일 선택</strong>
              <span className="mt-2 block text-sm text-muted-foreground">
                기기 사진 보관함이나 파일에서 바로 불러와요.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMode('camera')}
              className="rounded-[1.5rem] border-2 border-foreground/10 bg-card p-5 text-left transition-transform hover:-translate-y-0.5 hover:border-primary"
            >
              <Camera className="mb-4 h-8 w-8 text-primary" />
              <strong className="block font-[var(--font-display)] text-xl">카메라</strong>
              <span className="mt-2 block text-sm text-muted-foreground">
                실시간 화면을 보고 바로 촬영해서 채워 넣어요.
              </span>
            </button>

            <button
              type="button"
              onClick={() => void handleClipboardRead()}
              className="rounded-[1.5rem] border-2 border-foreground/10 bg-card p-5 text-left transition-transform hover:-translate-y-0.5 hover:border-primary"
            >
              <Clipboard className="mb-4 h-8 w-8 text-primary" />
              <strong className="block font-[var(--font-display)] text-xl">클립보드</strong>
              <span className="mt-2 block text-sm text-muted-foreground">
                복사해 둔 이미지를 바로 불러와서 적용해요.
              </span>
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
