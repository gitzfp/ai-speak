import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI语言学习平台',
  description: '智能语言学习平台，提供AI对话练习、语音评估等功能',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {children}
        <Toaster 
          position="top-center"
          richColors
          closeButton
          expand={false}
          duration={4000}
          style={{
            zIndex: 999999,
          }}
          toastOptions={{
            style: {
              zIndex: 999999,
            },
          }}
        />
      </body>
    </html>
  )
} 