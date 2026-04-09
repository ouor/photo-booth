'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { setOnboardingCompleted } from '@/lib/auth/mock-auth'
import { Camera, Sparkles, Share2, ChevronRight, ChevronLeft } from 'lucide-react'

const onboardingSteps = [
  {
    icon: Sparkles,
    title: '감성 프리셋 선택',
    description: '다양한 Y2K 감성 프리셋 중\n마음에 드는 스타일을 골라보세요'
  },
  {
    icon: Camera,
    title: '사진 꾸미기',
    description: '사진을 업로드하고\n귀여운 스티커로 꾸며보세요'
  },
  {
    icon: Share2,
    title: '저장하고 공유하기',
    description: '완성된 작품을 다운로드하고\n친구들과 공유해보세요'
  }
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    setOnboardingCompleted()
    router.push('/')
  }

  const step = onboardingSteps[currentStep]
  const Icon = step.icon

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Skip Button */}
        <div className="flex justify-end mb-4">
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="text-muted-foreground"
          >
            건너뛰기
          </Button>
        </div>

        {/* Content */}
        <Card className="y2k-shadow mb-8">
          <CardContent className="pt-12 pb-8 px-8">
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-12 h-12 text-primary" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold font-[var(--font-display)]">
                {step.title}
              </h2>

              {/* Description */}
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                {step.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Progress Indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          {currentStep > 0 && (
            <Button
              onClick={handlePrev}
              variant="outline"
              className="flex-1 h-12 gap-2 border-2"
            >
              <ChevronLeft className="w-5 h-5" />
              이전
            </Button>
          )}
          
          <Button
            onClick={handleNext}
            className="flex-1 h-12 gap-2 y2k-shadow"
          >
            {currentStep === onboardingSteps.length - 1 ? '시작하기' : '다음'}
            {currentStep < onboardingSteps.length - 1 && (
              <ChevronRight className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
