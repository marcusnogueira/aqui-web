'use client'

import { useCallback, useEffect, useRef } from 'react'
import useSWR, { mutate } from 'swr'
import { createClient } from '@/lib/supabase/client'
import { VendorWithLiveSession } from '@/types/vendor'
import { debounce } from 'lodash'
import { measureAsync, debouncedPerformanceLog } from '@/lib/performance-utils'
import toast from 'react-hot-toast'

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

// Generate cache key for SWR
const generateCacheKey = (params: UseLiveVendorsParams): string => {
  const { searchQuery, userLocation, mapBounds } = params
  
  const searchParams = new URLSearchParams()
  
  if (searchQuery?.trim()) {
    searchParams.set('q', searchQuery.trim())
  }
  
  if (userLocation) {
    searchParams.set('lat', userLocation.lat.toString())
    searchParams.set('lng', userLocation.lng.toString())
  }
  
  if (mapBounds) {
    searchParams.set('bounds', `${mapBounds.north},${mapBounds.south},${mapBounds.east},${mapBounds.west}`)
  }
  
  searchParams.set('limit', '100')
  
  return `/api/search/vendors?${searchParams.toString()}`
}

export function useLiveVendors(params: UseLiveVendorsParams = {}): UseLiveVendorsReturn {
  const { searchQuery = '', userLocation = null, mapBounds = null, enabled = true } = params
  const supabase = createClient()
  const realtimeChannelRef = useRef<any>(null)
  
  // Generate the cache key for SWR
  const cacheKey = enabled ? generateCacheKey({ searchQuery, userLocation, mapBounds }) : null
  
  // Real-time update handler - moved to top level to follow Rules of Hooks
  const handleRealtimeUpdate = useCallback(async (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    // Get current cache key for mutation
    const currentCacheKey = generateCacheKey({ searchQuery, userLocation, mapBounds })
    
    // Debounce rapid updates to prevent excessive re-renders
    if (eventType === 'UPDATE' && newRecord.is_active) {
      const updateVendorSession = debounce((record: any) => {
        mutate(
          currentCacheKey,
          (currentVendors: Vendor[] = []) => {
            return currentVendors.map(v => {
              if (v.id === record.vendor_id && v.live_session) {
                return {
                  ...v,
                  live_session: {
                    ...v.live_session,
                    ...record // Merge updated session fields
                  }
                }
              }
              return v
            })
          },
          { revalidate: false } // Don't refetch, just update cache
        )
      }, 500) // 500ms debounce for updates
      
      updateVendorSession(newRecord)
      return
    }
    
    if (eventType === 'INSERT') {
      // Update cache with new vendor session
      mutate(
        currentCacheKey,
        (currentVendors: Vendor[] = []) => {
          const existingVendor = currentVendors.find(v => v.id === newRecord.vendor_id)
          if (existingVendor) {
            // Update existing vendor with new session
            return currentVendors.map(v => 
              v.id === newRecord.vendor_id 
                ? { ...v, live_session: newRecord }
                : v
            )
          }
          return currentVendors
        },
        { revalidate: false }
      )
      
      // Trigger a lightweight refresh for new vendors
      setTimeout(() => {
        mutate(currentCacheKey)
      }, 1000)
      
    } else if (eventType === 'UPDATE' && !newRecord.is_active) {
      // Remove vendor when session becomes inactive
      mutate(
        currentCacheKey,
        (currentVendors: Vendor[] = []) => {
          return currentVendors.filter(v => v.id !== newRecord.vendor_id)
        },
        { revalidate: false }
      )
    } else if (eventType === 'DELETE') {
      // Remove vendor when session is deleted
      mutate(
        currentCacheKey,
        (currentVendors: Vendor[] = []) => {
          return currentVendors.filter(v => v.id !== oldRecord.vendor_id)
        },
        { revalidate: false }
      )
    }
  }, [searchQuery, userLocation, mapBounds])
  
  // Use SWR for data fetching with caching
  const { data: vendors = [], error, isLoading, mutate: swrMutate } = useSWR(
    cacheKey,
    async (url: string) => {
      return await measureAsync('search-vendors', async () => {
        const result = await fetchVendors(url)
        debouncedPerformanceLog()
        return result
      })
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Prevent duplicate requests within 5 seconds
      errorRetryCount: 3,
      onError: (error) => {
        console.error('Error fetching vendors:', error)
        toast.error('Failed to load vendors')
      }
    }
  )
  
  // Set up real-time subscription
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
  }, [enabled, searchQuery, userLocation, mapBounds, supabase])
  
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