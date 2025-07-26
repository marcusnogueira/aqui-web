'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardHeader } from './DashboardHeader'
import { Database } from '@/lib/database.types'

type Vendor = Database['public']['Tables']['vendors']['Row']
type VendorLiveSession = Database['public']['Tables']['vendor_live_sessions']['Row']

interface DashboardLayoutProps {
  children: React.ReactNode
  vendor: Vendor
  user: any
  liveSession: VendorLiveSession | null
  onSignOut: () => void
  onSwitchToCustomerMode: () => void
  onStartLiveSession: () => void
  onEndLiveSession: () => void
  isStartingSession: boolean
}

export function DashboardLayout({
  children,
  vendor,
  user,
  liveSession,
  onSignOut,
  onSwitchToCustomerMode,
  onStartLiveSession,
  onEndLiveSession,
  isStartingSession
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Load sidebar state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('vendor-dashboard-sidebar-collapsed')
      if (savedState !== null) {
        setSidebarCollapsed(JSON.parse(savedState))
      }
    }
  }, [])

  // Save sidebar state to localStorage
  const handleSidebarToggle = useCallback(() => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    if (typeof window !== 'undefined') {
      localStorage.setItem('vendor-dashboard-sidebar-collapsed', JSON.stringify(newState))
    }
  }, [sidebarCollapsed])

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Handle mobile menu interactions and keyboard navigation
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuOpen && !(event.target as Element).closest('.mobile-sidebar')) {
        setMobileMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Close mobile menu with Escape key
      if (event.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
      
      // Toggle sidebar with Ctrl/Cmd + B
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault()
        handleSidebarToggle()
      }
    }

    const handleTouchStart = (event: TouchEvent) => {
      // Store initial touch position for swipe detection
      const touch = event.touches[0]
      if (touch) {
        document.body.dataset.touchStartX = touch.clientX.toString()
        document.body.dataset.touchStartY = touch.clientY.toString()
      }
    }

    const handleTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      const startX = parseFloat(document.body.dataset.touchStartX || '0')
      const startY = parseFloat(document.body.dataset.touchStartY || '0')
      
      if (touch && startX && startY) {
        const deltaX = touch.clientX - startX
        const deltaY = touch.clientY - startY
        
        // Detect swipe gestures (minimum 50px horizontal movement, less than 100px vertical)
        if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 100) {
          // Swipe right from left edge to open mobile menu
          if (deltaX > 0 && startX < 20 && !mobileMenuOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
            setMobileMenuOpen(true)
          }
          // Swipe left to close mobile menu
          else if (deltaX < 0 && mobileMenuOpen) {
            setMobileMenuOpen(false)
          }
        }
      }
      
      // Clean up touch data
      delete document.body.dataset.touchStartX
      delete document.body.dataset.touchStartY
    }

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown)
    
    if (mobileMenuOpen) {
      document.addEventListener('click', handleClickOutside)
    }
    
    // Touch events for mobile swipe gestures
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true })
      document.addEventListener('touchend', handleTouchEnd, { passive: true })
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [mobileMenuOpen, handleSidebarToggle])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        onToggle={handleSidebarToggle}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
        liveSession={liveSession}
      />

      {/* Main content area */}
      <div className={`transition-all duration-300 ${
        sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
      }`}>
        {/* Header */}
        <DashboardHeader
          vendor={vendor}
          liveSession={liveSession}
          onSignOut={onSignOut}
          onSwitchToCustomerMode={onSwitchToCustomerMode}
          onStartLiveSession={onStartLiveSession}
          onEndLiveSession={onEndLiveSession}
          isStartingSession={isStartingSession}
          onMobileMenuToggle={handleMobileMenuToggle}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Main content */}
        <main className="fluid-container fluid-spacing-md">
          {children}
        </main>
      </div>
    </div>
  )
}