import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const nanumMugunghwa = localFont({
  src: '../public/fonts/NanumMugunghwa.ttf',
  variable: '--font-mugunghwa',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Photo Booth - Create Your Memories',
  description: 'Y2K inspired photo booth web service. Choose a preset, upload photos, and create beautiful memories.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={nanumMugunghwa.variable}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
