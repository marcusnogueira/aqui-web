'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  HomeIcon, 
  UserIcon, 
  PhotoIcon, 
  MapPinIcon, 
  MegaphoneIcon, 
  VideoCameraIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { Database } from '@/lib/database.types'

type VendorLiveSession = Database['public']['Tables']['vendor_live_sessions']['Row']

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path?: string
  badge?: string | number
  disabled?: boolean
}

interface DashboardSidebarProps {
  collapsed: boolean
  mobileMenuOpen: boolean
  onToggle: () => void
  onMobileMenuClose: () => void
  liveSession: VendorLiveSession | null
}

export function DashboardSidebar({
  collapsed,
  mobileMenuOpen,
  onToggle,
  onMobileMenuClose,
  liveSession
}: DashboardSidebarProps) {
  const router = useRouter()
  const { t } = useTranslation('dashboard')
  const [activeItem, setActiveItem] = useState('overview')

  const sidebarItems: SidebarItem[] = [
    { id: 'overview', label: t('sidebar.overview'), icon: HomeIcon },
    { id: 'profile', label: t('sidebar.profile'), icon: UserIcon },
    { id: 'gallery', label: t('sidebar.gallery'), icon: PhotoIcon },
    { id: 'locations', label: t('sidebar.locations'), icon: MapPinIcon },
    { id: 'announcements', label: t('sidebar.announcements'), icon: MegaphoneIcon },
    { 
      id: 'live', 
      label: t('sidebar.liveSession'), 
      icon: VideoCameraIcon, 
      badge: liveSession ? 'LIVE' : undefined 
    }
  ]

  // Focus management for mobile menu
  useEffect(() => {
    if (mobileMenuOpen) {
      // Focus the first navigation item when mobile menu opens
      const firstNavItem = document.querySelector('.mobile-sidebar button[role="button"]') as HTMLElement
      if (firstNavItem) {
        firstNavItem.focus()
      }
    }
  }, [mobileMenuOpen])

  // Update active item based on URL hash
  useEffect(() => {
    const updateActiveItem = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.replace('#', '')
        setActiveItem(hash || 'overview')
      }
    }

    // Set initial active item
    updateActiveItem()

    // Listen for hash changes
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', updateActiveItem)
      
      return () => {
        window.removeEventListener('hashchange', updateActiveItem)
      }
    }
  }, [])

  const handleNavigation = (itemId: string) => {
    // Update URL hash for navigation
    const url = `/vendor/dashboard#${itemId}`
    router.push(url)
    
    // Update active item state
    setActiveItem(itemId)
    
    // Close mobile menu after navigation
    if (mobileMenuOpen) {
      onMobileMenuClose()
    }

    // Dispatch custom event for tab switching
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dashboard-tab-change', { detail: itemId }))
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, itemId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleNavigation(itemId)
    }
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-background border-r border-border transition-all duration-300 z-30 hidden md:block ${
        collapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!collapsed && (
            <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1" role="navigation" aria-label="Dashboard navigation">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = activeItem === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
                disabled={item.disabled}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-foreground hover:bg-muted hover:text-foreground hover:shadow-sm'
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={collapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Navigate to ${item.label}${item.badge ? ` (${item.badge})` : ''}`}
              >
                <Icon className={`flex-shrink-0 transition-all duration-200 ${
                  collapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                } ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full transition-colors ${
                        isActive 
                          ? 'bg-primary-foreground text-primary' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && item.badge && (
                  <div className="absolute left-12 w-2 h-2 bg-green-500 rounded-full animate-pulse" 
                       aria-hidden="true" />
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onMobileMenuClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`mobile-sidebar fixed left-0 top-0 h-full w-64 bg-background border-r border-border transform transition-transform duration-300 z-50 md:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Mobile Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
          <button
            onClick={onMobileMenuClose}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Close menu"
          >
            <ChevronLeftIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Mobile Navigation Items */}
        <nav className="p-2 space-y-1" role="navigation" aria-label="Mobile dashboard navigation">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = activeItem === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
                disabled={item.disabled}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-foreground hover:bg-muted hover:text-foreground hover:shadow-sm'
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Navigate to ${item.label}${item.badge ? ` (${item.badge})` : ''}`}
              >
                <Icon className={`w-5 h-5 mr-3 flex-shrink-0 transition-colors ${
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                }`} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full transition-colors ${
                    isActive 
                      ? 'bg-primary-foreground text-primary' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </>
  )
}
