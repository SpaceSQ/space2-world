import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CitizenPulse } from '@/components/CitizenPulse'; // 🔥 引入

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SPACE².WORLD',
  description: 'Sovereign Identity & Silicon Workforce',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CitizenPulse /> {/* 🔥 植入脉搏：只要网站开着，数字人就在线 */}
        {children}
      </body>
    </html>
  )
}