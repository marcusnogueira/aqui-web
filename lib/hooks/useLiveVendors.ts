'use client'

import { useCallback, useEffect, useRef } from 'react'
import useSWR, { mutate } from 'swr'
import { createClient } from '@/lib/supabase/client'
import { VendorWithLiveSession } from '@/types/vendor'
import { measureAsync, debouncedPerformanceLog } from '@/lib/performance-utils'
import toast from 'react-hot-toast'

// Simple debounce function to prevent excessive updates
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

type Vendor = VendorWithLiveSession

interface UseLiveVendorsParams {
  searchQuery?: string
  userLocation?: { lat: number; lng: number } | null
  mapBounds?: { north: number; south: number; east: number; west: number } | null
  enabled?: boolean
}

interface UseLiveVendorsReturn {
  vendors: Vendor[]
  isLoading: boolean
  error: any
  mutate: () => void
}

// Fetcher function for SWR
const fetchVendors = async (url: string): Promise<Vendor[]> => {
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error('Failed to fetch vendors')
  }
  
  const data = await response.json()
  return data.vendors || []
}

// Generate cache key for SWR - FIXED: Much more stable key generation
const generateCacheKey = (params: UseLiveVendorsParams): string => {
  const { searchQuery, userLocation, mapBounds } = params
  
  const searchParams = new URLSearchParams()
  
  // Only add search query if it's meaningful (more than 2 characters)
  if (searchQuery?.trim() && searchQuery.trim().length > 2) {
    searchParams.set('q', searchQuery.trim())
  }
  
  // Round coordinates to 2 decimal places to reduce cache key variations
  if (userLocation) {
    searchParams.set('lat', userLocation.lat.toFixed(2))
    searchParams.set('lng', userLocation.lng.toFixed(2))
  }
  
  // Round bounds to 2 decimal places and only include if significantly different
  if (mapBounds) {
    const roundedBounds = [
      mapBounds.north.toFixed(2),
      mapBounds.south.toFixed(2), 
      mapBounds.east.toFixed(2),
      mapBounds.west.toFixed(2)
    ].join(',')
    searchParams.set('bounds', roundedBounds)
  }
  
  searchParams.set('limit', '100')
  
  return `/api/search/vendors?${searchParams.toString()}`
}

export function useLiveVendors(params: UseLiveVendorsParams = {}): UseLiveVendorsReturn {
  const { searchQuery = '', userLocation = null, mapBounds = null, enabled = true } = params
  const supabase = createClient()
  const realtimeChannelRef = useRef<any>(null)
  
  // Stable cache key reference to prevent unnecessary re-subscriptions
  const stableCacheKeyRef = useRef<string | null>(null)
  
  // Generate the cache key for SWR
  const cacheKey = enabled ? generateCacheKey({ searchQuery, userLocation, mapBounds }) : null
  
  // Update stable cache key reference when it changes
  useEffect(() => {
    stableCacheKeyRef.current = cacheKey
  }, [cacheKey])
  
  // Real-time update handler - FIXED: Completely disable real-time updates to prevent refresh loops
  const handleRealtimeUpdate = useCallback(async (payload: any) => {
    // TEMPORARILY DISABLED: Real-time updates are causing excessive refreshes
    // We'll rely on manual refresh and periodic updates instead
    console.log('Real-time update received but disabled to prevent refresh loops:', payload.eventType)
    return
    
    /* DISABLED CODE:
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    // Use the stable cache key reference
    const currentCacheKey = stableCacheKeyRef.current
    if (!currentCacheKey) return
    
    // Only handle critical updates with heavy debouncing
    if (eventType === 'INSERT' || (eventType === 'UPDATE' && !newRecord.is_active)) {
      // Use a much longer debounce for real-time updates
      const debouncedUpdate = debounce(() => {
        mutate(currentCacheKey, undefined, { revalidate: true })
      }, 5000) // 5 second debounce
      
      debouncedUpdate()
    }
    */
  }, []) // FIXED: No dependencies to prevent re-subscriptions
  
  // Use SWR for data fetching with caching - FIXED: Aggressive caching to prevent excessive calls
  const { data: vendors = [], error, isLoading, mutate: swrMutate } = useSWR(
    cacheKey,
    async (url: string) => {
      console.log('🔄 Fetching vendors from:', url) // Debug log
      return await measureAsync('search-vendors', async () => {
        const result = await fetchVendors(url)
        debouncedPerformanceLog()
        return result
      })
    },
    {
      revalidateOnFocus: false, // Don't refetch when window gains focus
      revalidateOnReconnect: false, // Don't refetch on reconnect
      revalidateIfStale: false, // Don't refetch if data is stale
      revalidateOnMount: true, // Only revalidate on initial mount
      dedupingInterval: 120000, // Prevent duplicate requests within 2 minutes
      refreshInterval: 0, // Disable automatic refresh completely
      errorRetryCount: 1, // Minimal retry count
      errorRetryInterval: 15000, // 15 second retry interval
      keepPreviousData: true, // Keep previous data while fetching new data
      compare: (a, b) => {
        // Custom comparison to prevent unnecessary re-renders
        return JSON.stringify(a) === JSON.stringify(b)
      },
      onError: (error) => {
        console.error('Error fetching vendors:', error)
        // Only show toast error on initial load, not on retries
        if (!vendors || vendors.length === 0) {
          toast.error('Failed to load vendors')
        }
      }
    }
  )
  
  // Set up real-time subscription - FIXED: Only depend on enabled to prevent re-subscriptions
  useEffect(() => {
    if (!enabled) return
    
    // Clean up existing channel
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current)
    }
    
    // Set up the real-time channel
    const channel = supabase
      .channel('vendor-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendor_live_sessions',
        },
        handleRealtimeUpdate
      )
      .subscribe()
    
    realtimeChannelRef.current = channel
    
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current)
        realtimeChannelRef.current = null
      }
    }
  }, [enabled, handleRealtimeUpdate]) // FIXED: Only depend on enabled and stable handler
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current)
      }
    }
  }, [])
  
  return {
    vendors,
    isLoading,
    error,
    mutate: () => swrMutate()
  }
}