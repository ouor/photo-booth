import { getEditorPresetDocument } from "@/lib/data/preset-documents"

export interface Preset {
  id: string
  name: string
  description: string
  thumbnailUrl: string
  requiredPhotos: number
  layout: LayoutConfig
  tags: string[]
  category: string
  createdAt: string
}

export interface LayoutConfig {
  width: number
  height: number
  backgroundImage?: string
  backgroundColor?: string
  decorations?: Decoration[]
}

export interface Decoration {
  id: string
  type: 'sticker' | 'text' | 'shape'
  imageUrl?: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
}

export interface Sticker {
  id: string
  imageUrl: string
  name: string
  category: 'default' | 'user'
  userId?: string
}

function enrichPresetFromDocument(preset: Preset): Preset {
  const presetDocument = getEditorPresetDocument(preset.id)
  if (!presetDocument) {
    return preset
  }

  const requiredPhotos = presetDocument.inputs.filter((input) => input.type === "image").length

  return {
    ...preset,
    name: presetDocument.metadata.name,
    description: presetDocument.metadata.description ?? preset.description,
    tags: presetDocument.metadata.tags ?? preset.tags,
    requiredPhotos: requiredPhotos > 0 ? requiredPhotos : preset.requiredPhotos,
    layout: {
      ...preset.layout,
      width: presetDocument.output.width,
      height: presetDocument.output.height,
      backgroundColor: presetDocument.output.backgroundColor ?? preset.layout.backgroundColor,
    },
  }
}

// Mock Presets Data
export const mockPresets: Preset[] = [
  {
    id: 'cherry-blossom',
    name: '벚꽃 감성',
    description: '봄날의 따뜻한 벚꽃 감성을 담아보세요',
    thumbnailUrl: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=600&fit=crop',
    requiredPhotos: 4,
    layout: {
      width: 800,
      height: 1200,
      backgroundColor: '#FFF5F7',
    },
    tags: ['봄', '벚꽃', '감성', '핑크'],
    category: '계절',
    createdAt: '2024-03-15',
  },
  {
    id: 'retro-film',
    name: '레트로 필름',
    description: '필름 카메라로 찍은 듯한 빈티지 감성',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=400&h=600&fit=crop',
    requiredPhotos: 3,
    layout: {
      width: 800,
      height: 1200,
      backgroundColor: '#FFF9E6',
    },
    tags: ['레트로', '빈티지', '필름', '감성'],
    category: '스타일',
    createdAt: '2024-03-14',
  },
  {
    id: 'summer-vacation',
    name: '여름 바캉스',
    description: '시원한 여름날의 추억을 간직하세요',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=600&fit=crop',
    requiredPhotos: 4,
    layout: {
      width: 800,
      height: 1200,
      backgroundColor: '#E6F7FF',
    },
    tags: ['여름', '바다', '휴가', '블루'],
    category: '계절',
    createdAt: '2024-03-13',
  },
  {
    id: 'diary-scrap',
    name: '다이어리 스크랩',
    description: '다꾸처럼 귀엽게 꾸며보세요',
    thumbnailUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=600&fit=crop',
    requiredPhotos: 6,
    layout: {
      width: 800,
      height: 1200,
      backgroundColor: '#FFF0F5',
    },
    tags: ['다꾸', '스크랩', '귀여운', 'Y2K'],
    category: '스타일',
    createdAt: '2024-03-12',
  },
  {
    id: 'polaroid-grid',
    name: '폴라로이드 그리드',
    description: '폴라로이드 사진을 모아둔 느낌',
    thumbnailUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400&h=600&fit=crop',
    requiredPhotos: 4,
    layout: {
      width: 800,
      height: 1200,
      backgroundColor: '#FFFFFF',
    },
    tags: ['폴라로이드', '그리드', '심플'],
    category: '스타일',
    createdAt: '2024-03-11',
  },
  {
    id: 'gradient-pop',
    name: '그라데이션 팝',
    description: '화려한 그라데이션으로 개성있게',
    thumbnailUrl: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=600&fit=crop',
    requiredPhotos: 3,
    layout: {
      width: 800,
      height: 1200,
      backgroundColor: '#FFE6F0',
    },
    tags: ['그라데이션', '화려한', '팝', '컬러풀'],
    category: '스타일',
    createdAt: '2024-03-10',
  },
].map(enrichPresetFromDocument);

// Mock Stickers Data
export const mockStickers: Sticker[] = [
  { id: 'star-1', imageUrl: '/stickers/star.svg', name: '별', category: 'default' },
  { id: 'heart-1', imageUrl: '/stickers/heart.svg', name: '하트', category: 'default' },
  { id: 'flower-1', imageUrl: '/stickers/flower.svg', name: '꽃', category: 'default' },
  { id: 'cloud-1', imageUrl: '/stickers/cloud.svg', name: '구름', category: 'default' },
  { id: 'rainbow-1', imageUrl: '/stickers/rainbow.svg', name: '무지개', category: 'default' },
];

// Helper functions
export function getPresetById(id: string): Preset | undefined {
  return mockPresets.find((preset) => preset.id === id)
}

export function getPresetsByCategory(category: string): Preset[] {
  return mockPresets.filter((preset) => preset.category === category)
}

export function getPresetsByTag(tag: string): Preset[] {
  return mockPresets.filter((preset) => preset.tags.includes(tag))
}
