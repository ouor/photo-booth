'use client'

// localStorage utilities for storing user data
// This will be replaced with real backend API later

export interface SavedWork {
  id: string
  presetId: string
  presetName: string
  imageDataUrl: string
  thumbnailUrl: string
  createdAt: string
  updatedAt: string
}

export interface CustomSticker {
  id: string
  name: string
  imageDataUrl: string
  category: string
  isFavorite: boolean
  createdAt: string
}

export interface UserPreset {
  id: string
  name: string
  description: string
  thumbnailUrl: string
  category: string
  tags: string[]
  layout: {
    width: number
    height: number
    backgroundColor?: string
    backgroundImage?: string
  }
  isPublic: boolean
  createdAt: string
  authorId: string
}

const WORKS_KEY = 'photo-booth-works'
const STICKERS_KEY = 'photo-booth-stickers'
const USER_PRESETS_KEY = 'photo-booth-user-presets'

// Works
export function getSavedWorks(): SavedWork[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(WORKS_KEY)
  return stored ? JSON.parse(stored) : []
}

export function saveWork(work: SavedWork): void {
  const works = getSavedWorks()
  const index = works.findIndex(w => w.id === work.id)
  if (index >= 0) {
    works[index] = work
  } else {
    works.push(work)
  }
  localStorage.setItem(WORKS_KEY, JSON.stringify(works))
}

export function deleteWork(id: string): void {
  const works = getSavedWorks().filter(w => w.id !== id)
  localStorage.setItem(WORKS_KEY, JSON.stringify(works))
}

// Stickers
export function getCustomStickers(): CustomSticker[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STICKERS_KEY)
  return stored ? JSON.parse(stored) : []
}

export function saveSticker(sticker: CustomSticker): void {
  const stickers = getCustomStickers()
  const index = stickers.findIndex(s => s.id === sticker.id)
  if (index >= 0) {
    stickers[index] = sticker
  } else {
    stickers.push(sticker)
  }
  localStorage.setItem(STICKERS_KEY, JSON.stringify(stickers))
}

export function deleteSticker(id: string): void {
  const stickers = getCustomStickers().filter(s => s.id !== id)
  localStorage.setItem(STICKERS_KEY, JSON.stringify(stickers))
}

export function toggleStickerFavorite(id: string): void {
  const stickers = getCustomStickers()
  const sticker = stickers.find(s => s.id === id)
  if (sticker) {
    sticker.isFavorite = !sticker.isFavorite
    localStorage.setItem(STICKERS_KEY, JSON.stringify(stickers))
  }
}

// User Presets
export function getUserPresets(): UserPreset[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(USER_PRESETS_KEY)
  return stored ? JSON.parse(stored) : []
}

export function saveUserPreset(preset: UserPreset): void {
  const presets = getUserPresets()
  const index = presets.findIndex(p => p.id === preset.id)
  if (index >= 0) {
    presets[index] = preset
  } else {
    presets.push(preset)
  }
  localStorage.setItem(USER_PRESETS_KEY, JSON.stringify(presets))
}

export function deleteUserPreset(id: string): void {
  const presets = getUserPresets().filter(p => p.id !== id)
  localStorage.setItem(USER_PRESETS_KEY, JSON.stringify(presets))
}
