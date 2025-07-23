'use client'

import { Database } from '@/types/database'

type Vendor = Database['public']['Tables']['vendors']['Row']
type VendorLiveSession = Database['public']['Tables']['vendor_live_sessions']['Row']
type VendorStaticLocation = Database['public']['Tables']['vendor_static_locations']['Row']

interface OverviewSectionProps {
  vendor: Vendor
  liveSession: VendorLiveSession | null
  staticLocations: VendorStaticLocation[]
}

export function OverviewSection({ vendor, liveSession, staticLocations }: OverviewSectionProps) {
  return (
    <div className="fluid-grid">
      {/* Stats Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 fluid-spacing-sm container-responsive" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 className="fluid-text-lg font-medium mb-2" style={{ color: '#3A938A' }}>Rating</h3>
        <div className="fluid-text-2xl font-bold" style={{ color: '#3A938A' }}>
          0.0
        </div>
        <p className="fluid-text-sm" style={{ color: '#777777' }}>No reviews yet</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 fluid-spacing-sm container-responsive" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 className="fluid-text-lg font-medium mb-2" style={{ color: '#3A938A' }}>Status</h3>
        <div className={`fluid-text-2xl font-bold`}
             style={{ color: liveSession ? '#3A938A' : '#777777' }}>
          {liveSession ? 'Live' : 'Offline'}
        </div>
        <p className="fluid-text-sm" style={{ color: '#777777' }}>
          {liveSession ? 'Currently serving customers' : 'Not currently active'}
        </p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 fluid-spacing-sm container-responsive" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 className="fluid-text-lg font-medium mb-2" style={{ color: '#3A938A' }}>Locations</h3>
        <div className="fluid-text-2xl font-bold" style={{ color: '#3A938A' }}>
          {staticLocations.length}
        </div>
        <p className="fluid-text-sm" style={{ color: '#777777' }}>Saved locations</p>
      </div>
    </div>
  )
}