'use client'

import { useCrossFade } from '@/lib/animations'
import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const ref = useCrossFade({ duration: 0.3, delay: 50 })

  return (
    <div ref={ref} className={`animate-crossFade ${className}`}>
      {children}
    </div>
  )
}