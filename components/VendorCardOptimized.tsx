'use client'

import React, { memo } from 'react'
import { Star, Clock } from 'lucide-react'
import { VendorWithLiveSession, getVendorStatus } from '@/lib/vendor-utils'

interface VendorCardOptimizedProps {
  vendor: VendorWithLiveSession
  onClick: (vendorId: string) => void
  onMouseEnter?: (vendorId: string) => void
  onMouseLeave?: (vendorId: string) => void
}

function VendorCardOptimized({ 
  vendor, 
  onClick, 
  onMouseEnter, 
  onMouseLeave 
}: VendorCardOptimizedProps) {
  const status = getVendorStatus(vendor)
  
  const handleClick = () => {
    onClick(vendor.id)
  }
  
  const handleMouseEnter = () => {
    onMouseEnter?.(vendor.id)
  }
  
  const handleMouseLeave = () => {
    onMouseLeave?.(vendor.id)
  }

  return (
    <div
      className="bg-card rounded-lg border border-border hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden container-responsive"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex">
        {/* Image */}
        <div className="relative w-24 h-24 bg-muted flex-shrink-0">
          {vendor.profile_image_url ? (
            <img
              src={vendor.profile_image_url}
              alt={vendor.business_name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <div className="text-2xl">🍽️</div>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-1 left-1">
            <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-white text-xs font-medium ${
              status === 'open' ? 'bg-green-500' :
              status === 'closing' ? 'bg-yellow-500' : 'bg-gray-500'
            }`}>
              <div className="w-1.5 h-1.5 bg-background rounded-full"></div>
              <span className="text-xs">
                {status === 'open' ? 'Open' :
                 status === 'closing' ? 'Closing' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-3">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-foreground text-sm line-clamp-1">
              {vendor.business_name}
            </h3>
            {vendor.average_rating && vendor.total_reviews && vendor.total_reviews > 0 && (
              <div className="flex items-center space-x-1 ml-2">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="text-xs font-medium text-foreground">
                  {vendor.average_rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
          
          {vendor.subcategory && (
            <p className="text-xs text-muted-foreground mb-1">{vendor.subcategory}</p>
          )}
          
          {vendor.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {vendor.description}
            </p>
          )}
          
          {vendor.live_session && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Live session active</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders
// Only re-render if vendor data, onClick, or mouse handlers change
export default memo(VendorCardOptimized, (prevProps, nextProps) => {
  return (
    prevProps.vendor.id === nextProps.vendor.id &&
    prevProps.vendor.business_name === nextProps.vendor.business_name &&
    prevProps.vendor.description === nextProps.vendor.description &&
    prevProps.vendor.profile_image_url === nextProps.vendor.profile_image_url &&
    prevProps.vendor.average_rating === nextProps.vendor.average_rating &&
    prevProps.vendor.total_reviews === nextProps.vendor.total_reviews &&
    prevProps.vendor.subcategory === nextProps.vendor.subcategory &&
    prevProps.vendor.live_session?.is_active === nextProps.vendor.live_session?.is_active &&
    prevProps.onClick === nextProps.onClick &&
    prevProps.onMouseEnter === nextProps.onMouseEnter &&
    prevProps.onMouseLeave === nextProps.onMouseLeave
  )
})