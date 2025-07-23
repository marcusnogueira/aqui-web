'use client'

import { useState, useEffect } from 'react'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { Database } from '@/types/database'

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
        message = 'Your application is under review. You will be notified once it has been approved.'
        break
      case 'rejected':
        message = vendor.rejection_reason 
          ? `Your application was not approved. Reason: ${vendor.rejection_reason}. Please contact support if you need assistance with reapplying.`
          : 'Your application was not approved. Please contact support for more information.'
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
      <div className="bg-white shadow-sm border-b">
        <div className="fluid-container">
          <div className="flex justify-between items-center fluid-spacing-sm">
            <div className="flex items-center">
              {/* Mobile hamburger menu */}
              <button
                onClick={onMobileMenuToggle}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors md:hidden mr-3"
                aria-label="Open menu"
              >
                <Bars3Icon className="w-6 h-6 text-gray-600" />
              </button>
              
              <div>
                <h1 className="fluid-text-2xl font-semibold" style={{ color: '#222222' }}>
                  {vendor.business_name}
                </h1>
                <p className="fluid-text-base" style={{ color: '#777777' }}>
                  {vendor.subcategory}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {liveSession ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-medium">Live Now</span>
                  {timeRemaining !== null && (
                    <span className="text-orange-600 font-medium text-sm">
                      ⏳ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                  <button
                    onClick={onEndLiveSession}
                    className="px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#DC2626', color: '#FBF2E3' }}
                  >
                    End Session
                  </button>
                </div>
              ) : (
                <button
                  onClick={onStartLiveSession}
                  disabled={isStartingSession || vendor.status !== 'approved'}
                  className="px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#D85D28', color: '#FBF2E3' }}
                >
                  {isStartingSession ? 'Starting...' : 'Go Live'}
                </button>
              )}
              
              <button
                onClick={onSignOut}
                className="px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition-opacity border border-gray-300"
                style={{ backgroundColor: '#ffffff', color: '#DC2626' }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}