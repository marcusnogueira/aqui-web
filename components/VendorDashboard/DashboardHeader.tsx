'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { Database } from '@/types/database'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'

type Vendor = Database['public']['Tables']['vendors']['Row']
type VendorLiveSession = Database['public']['Tables']['vendor_live_sessions']['Row']

interface DashboardHeaderProps {
  vendor: Vendor
  liveSession: VendorLiveSession | null
  onSignOut: () => void
  onSwitchToCustomerMode: () => void
  onStartLiveSession: () => void
  onEndLiveSession: () => void
  isStartingSession: boolean
  onMobileMenuToggle: () => void
  sidebarCollapsed: boolean
}

export function DashboardHeader({
  vendor,
  liveSession,
  onSignOut,
  onSwitchToCustomerMode,
  onStartLiveSession,
  onEndLiveSession,
  isStartingSession,
  onMobileMenuToggle,
  sidebarCollapsed
}: DashboardHeaderProps) {
  const { t } = useTranslation('dashboard')
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  // Timer countdown effect
  useEffect(() => {
    if (liveSession?.auto_end_time && liveSession.is_active) {
      const updateTimer = () => {
        const now = new Date().getTime()
        const endTime = new Date(liveSession.auto_end_time!).getTime()
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
        
        setTimeRemaining(remaining)
        
        if (remaining === 0) {
          // Session should have ended, refresh data
          setTimeRemaining(null)
        }
      }
      
      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      
      return () => clearInterval(interval)
    } else {
      setTimeRemaining(null)
    }
  }, [liveSession?.auto_end_time, liveSession?.is_active])

  const getStatusBanner = () => {
    if (!vendor || vendor.status === 'approved') {
      return null
    }

    let message = ''
    let bgColor = 'bg-yellow-100'
    let textColor = 'text-yellow-800'

    switch (vendor.status) {
      case 'pending':
        message = t('header.pending')
        break
      case 'rejected':
        message = vendor.rejection_reason 
          ? t('header.rejected', { reason: vendor.rejection_reason })
          : t('header.rejected_no_reason')
        bgColor = 'bg-red-100'
        textColor = 'text-red-800'
        break
    }

    return (
      <div className={`p-4 text-center ${bgColor} ${textColor}`}>
        <p>{message}</p>
      </div>
    )
  }

  return (
    <>
      {getStatusBanner()}
      
      {/* Header */}
      <div className="bg-background shadow-sm border-b border-border">
        <div className="fluid-container">
          <div className="flex justify-between items-center fluid-spacing-sm">
            <div className="flex items-center">
              {/* Mobile hamburger menu */}
              <button
                onClick={onMobileMenuToggle}
                className="p-2 rounded-md hover:bg-muted transition-colors md:hidden mr-3"
                aria-label="Open menu"
              >
                <Bars3Icon className="w-6 h-6 text-muted-foreground" />
              </button>
              
              <div>
                <h1 className="fluid-text-2xl font-semibold text-foreground">
                  {vendor.business_name}
                </h1>
                <p className="fluid-text-base text-muted-foreground">
                  {vendor.subcategory}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <ThemeToggle />
              
              {liveSession ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-medium">{t('header.liveNow')}</span>
                  {timeRemaining !== null && (
                    <span className="text-orange-600 font-medium text-sm">
                      ⏳ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                  <button
                    onClick={onEndLiveSession}
                    className="px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition-opacity bg-red-600 text-red-50"
                  >
                    {t('header.endSession')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={onStartLiveSession}
                  disabled={isStartingSession || vendor.status !== 'approved'}
                  className="px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 bg-primary text-primary-foreground"
                >
                  {isStartingSession ? t('header.starting') : t('header.goLive')}
                </button>
              )}
              
              <button
                onClick={onSignOut}
                className="px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition-opacity border border-destructive text-destructive-foreground bg-destructive/10"
              >
                {t('header.signOut')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}