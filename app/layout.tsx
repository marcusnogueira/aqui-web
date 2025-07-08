import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#3A938A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3003'),
  title: 'Aqui - Find Local Gems Hidden ',
  description: 'Discover amazing local vendors in your area with real-time location tracking.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192x192.svg',
    apple: '/icon-192x192.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AQUI',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'AQUI',
    title: 'AQUI - Find Local Food Vendors',
    description: 'Discover amazing local food vendors in your area with real-time location tracking.',
  },
  twitter: {
    card: 'summary',
    title: 'AQUI - Find Local Food Vendors',
    description: 'Discover amazing local food vendors in your area with real-time location tracking.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Varela+Round:wght@400&display=swap"
          rel="stylesheet"
        />
        <script
          async
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#3A938A',
                color: '#fff',
                borderRadius: '8px',
                fontFamily: 'Varela Round, sans-serif',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}