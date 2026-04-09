'use client'

// Mock authentication utilities using localStorage
// This will be replaced with real backend authentication later

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: string
}

const STORAGE_KEY = 'photo-booth-user'
const ONBOARDING_KEY = 'photo-booth-onboarding-completed'

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null
  
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function setCurrentUser(user: User): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}

export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === 'true'
}

export function setOnboardingCompleted(): void {
  localStorage.setItem(ONBOARDING_KEY, 'true')
}

// Mock login function
export function mockLogin(email: string, password: string): User | null {
  // In real implementation, this would call the backend API
  const user: User = {
    id: `user-${Date.now()}`,
    name: email.split('@')[0],
    email,
    avatar: undefined,
    createdAt: new Date().toISOString()
  }
  
  setCurrentUser(user)
  return user
}

// Mock social login
export function mockSocialLogin(provider: 'google' | 'kakao'): User {
  const user: User = {
    id: `user-${provider}-${Date.now()}`,
    name: `${provider} User`,
    email: `user@${provider}.com`,
    avatar: undefined,
    createdAt: new Date().toISOString()
  }
  
  setCurrentUser(user)
  return user
}
