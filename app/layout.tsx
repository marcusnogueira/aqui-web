import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import ToasterProvider from '@/components/ToasterProvider'
import I18nProvider from '@/components/I18nProvider'
import { auth } from '@/app/api/auth/[...nextauth]/auth'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#3A938A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'Aqui - Find Local Gems Hidden ',
  description: 'Discover amazing local vendors in your area with real-time location tracking.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192x192.svg',
    apple: '/icon-192x192.svg',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth() // ✅ fetch server session

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <I18nProvider>
          <Providers session={session}> {/* ✅ pass session here */}
            {children}
            <ToasterProvider />
          </Providers>
        </I18nProvider>
      </body>
    </html>
  )
}
