'use client'

import { useMemo } from 'react'
import useSWR from 'swr'
import { VendorWithLiveSession } from '@/types/vendor'
import { measureAsync, debouncedPerformanceLog } from '@/lib/performance-utils'

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
  // Map data API returns markers array, convert to vendor format
  return data.markers?.map((marker: any) => marker.vendor) || []
}

// Generate ULTRA-STABLE cache key - only search query matters
const generateCacheKey = (searchQuery: string): string => {
  const searchParams = new URLSearchParams()
  
  // Only add search query if it's meaningful (more than 2 characters)
  if (searchQuery?.trim() && searchQuery.trim().length > 2) {
    searchParams.set('q', searchQuery.trim())
  }
  
  searchParams.set('limit', '100')
  
  // Use map-data API for live vendors instead of search API
  return `/api/vendors/map-data?${searchParams.toString()}`
}

export function useLiveVendors(params: UseLiveVendorsParams = {}): UseLiveVendorsReturn {
  const { searchQuery = '', enabled = true } = params
  
  // ULTRA-STABLE cache key - only depends on search query
  const cacheKey = useMemo(() => {
    return enabled ? generateCacheKey(searchQuery) : null
  }, [enabled, searchQuery])
  
  // Use SWR for data fetching with AGGRESSIVE caching to prevent refresh loops
  const { data: vendors = [], error, isLoading, mutate: swrMutate } = useSWR(
    cacheKey,
    async (url: string) => {
      console.log('🔄 Fetching vendors from:', url)
      return await measureAsync('search-vendors', async () => {
        const result = await fetchVendors(url)
        debouncedPerformanceLog()
        return result
      })
    },
    {
      // AGGRESSIVE caching settings to prevent refresh loops
      revalidateOnFocus: false,
      revalidateOnReconnect: false, 
      revalidateIfStale: false,
      revalidateOnMount: true,
      dedupingInterval: 300000, // 5 minutes - prevent duplicate requests
      refreshInterval: 0, // NO automatic refresh
      errorRetryCount: 1,
      errorRetryInterval: 30000,
      keepPreviousData: true,
      compare: (a, b) => JSON.stringify(a) === JSON.stringify(b),
      onError: (error) => {
        console.error('Error fetching vendors:', error)
      }
    }
  )
  
  return {
    vendors,
    isLoading,
    error,
    mutate: () => swrMutate()
  }
}