export interface CanvasImage {
  id: string
  src: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

export interface CanvasSticker {
  id: string
  stickerId: string
  imageUrl: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

export interface EditorState {
  images: CanvasImage[]
  stickers: CanvasSticker[]
  selectedId: string | null
}
