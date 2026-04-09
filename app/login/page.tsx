'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { mockLogin, mockSocialLogin, hasCompletedOnboarding } from '@/lib/auth/mock-auth'
import { Chrome, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const user = mockLogin(email, password)
    if (user) {
      // Check if onboarding is completed
      if (hasCompletedOnboarding()) {
        router.push('/')
      } else {
        router.push('/onboarding')
      }
    }
    
    setIsLoading(false)
  }

  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    mockSocialLogin(provider)
    
    // Check if onboarding is completed
    if (hasCompletedOnboarding()) {
      router.push('/')
    } else {
      router.push('/onboarding')
    }
    
    setIsLoading(false)
  }

  const handleGuestMode = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md y2k-shadow">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold font-[var(--font-display)] mb-2">
            Photo Booth
          </CardTitle>
          <CardDescription className="text-base">
            Y2K 감성으로 추억을 만들어보세요
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Social Login */}
          <div className="space-y-3">
            <Button
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading}
              className="w-full h-12 gap-3 bg-white text-foreground border-2 border-foreground hover:bg-muted"
              variant="outline"
            >
              <Chrome className="w-5 h-5" />
              <span className="font-bold">Google로 시작하기</span>
            </Button>
            
            <Button
              onClick={() => handleSocialLogin('kakao')}
              disabled={isLoading}
              className="w-full h-12 gap-3 bg-[#FEE500] text-[#000000] border-2 border-foreground hover:bg-[#FDD835]"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-bold">카카오로 시작하기</span>
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-muted" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-muted-foreground font-bold">
                또는
              </span>
            </div>
          </div>

          {/* Email Login */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-2"
              />
            </div>
            
            <div>
              <Input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 border-2"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 font-bold y2k-shadow"
            >
              {isLoading ? '로그인 중...' : '이메일로 로그인'}
            </Button>
          </form>

          {/* Guest Mode */}
          <div className="pt-4 border-t-2">
            <Button
              onClick={handleGuestMode}
              variant="ghost"
              className="w-full h-12 font-bold"
            >
              게스트로 둘러보기
            </Button>
          </div>

          {/* Terms */}
          <p className="text-xs text-center text-muted-foreground">
            계속 진행하면{' '}
            <Link href="/terms" className="underline">
              이용약관
            </Link>
            {' '}및{' '}
            <Link href="/privacy" className="underline">
              개인정보처리방침
            </Link>
            에 동의하는 것으로 간주됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
