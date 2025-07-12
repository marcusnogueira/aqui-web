'use client'

import { errorHandler, createGeolocationError, ErrorSeverity, ErrorType, Result, createResult } from '@/lib/error-handler'

// Direction providers
export type DirectionProvider = 'openstreetmap' | 'google'

// Configuration for direction providers
interface DirectionConfig {
  provider: DirectionProvider
  useGoogleDirections?: boolean // Environment variable override
}

// Get current direction provider from environment or default
export function getDirectionProvider(): DirectionProvider {
  if (typeof window === 'undefined') return 'openstreetmap'
  
  // Check environment variable (can be set via .env.local)
  const useGoogle = process.env.NEXT_PUBLIC_USE_GOOGLE_DIRECTIONS === 'true'
  return useGoogle ? 'google' : 'openstreetmap'
}

// Generate direction URL based on provider
export function generateDirectionUrl(
  destination: { lat: number; lng: number },
  origin?: { lat: number; lng: number },
  provider?: DirectionProvider
): string {
  const selectedProvider = provider || getDirectionProvider()
  
  if (selectedProvider === 'google') {
    const baseUrl = 'https://www.google.com/maps/dir/'
    const params = new URLSearchParams({
      api: '1',
      destination: `${destination.lat},${destination.lng}`
    })
    
    if (origin) {
      params.set('origin', `${origin.lat},${origin.lng}`)
    }
    
    return `${baseUrl}?${params.toString()}`
  } else {
    // OpenStreetMap with OSRM engine
    const baseUrl = 'https://www.openstreetmap.org/directions'
    const params = new URLSearchParams({
      engine: 'fossgis_osrm_car'
    })
    
    if (origin) {
      params.set('route', `${origin.lat},${origin.lng};${destination.lat},${destination.lng}`)
    } else {
      // If no origin, OSM will prompt user for starting location
      params.set('route', `${destination.lat},${destination.lng}`)
    }
    
    return `${baseUrl}?${params.toString()}`
  }
}

// Get user's current location with timeout and error handling
export function getCurrentLocation(options?: PositionOptions): Promise<Result<{ lat: number; lng: number }>> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      const error = createGeolocationError(
        'Geolocation is not supported by this browser',
        'GEOLOCATION_NOT_SUPPORTED'
      )
      resolve(createResult.error(error))
      return
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds
      maximumAge: 300000, // 5 minutes
      ...options
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(createResult.success({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }))
      },
      (error) => {
        let errorMessage = 'Failed to get location'
        let errorCode = 'GEOLOCATION_FAILED'
        let severity = ErrorSeverity.MEDIUM
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user'
            errorCode = 'GEOLOCATION_PERMISSION_DENIED'
            severity = ErrorSeverity.LOW
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable'
            errorCode = 'GEOLOCATION_UNAVAILABLE'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out'
            errorCode = 'GEOLOCATION_TIMEOUT'
            break
        }
        
        const standardError = errorHandler.create(
          ErrorType.GEOLOCATION,
          errorMessage,
          severity,
          errorCode,
          { originalError: error, options: defaultOptions },
          'getCurrentLocation'
        )
        resolve(createResult.error(standardError))
      },
      defaultOptions
    )
  })
}

// Main function to get directions - handles geolocation and opens direction URL
export async function getDirections(
  destination: { lat: number; lng: number },
  options?: {
    provider?: DirectionProvider
    useCurrentLocation?: boolean
    openInNewTab?: boolean
    onLocationError?: (error: Error) => void
    onLocationSuccess?: (location: { lat: number; lng: number }) => void
  }
): Promise<Result<void>> {
  try {
    const {
      provider,
      useCurrentLocation = true,
      openInNewTab = true,
      onLocationError,
      onLocationSuccess
    } = options || {}

    let origin: { lat: number; lng: number } | undefined

    // Try to get current location if requested
    if (useCurrentLocation) {
      const locationResult = await getCurrentLocation()
      if (locationResult.success) {
        origin = locationResult.data
        onLocationSuccess?.(origin)
      } else {
        // Log the error but continue without origin
        errorHandler.handle(locationResult.error, 'getDirections.getCurrentLocation')
        onLocationError?.(locationResult.error)
        // Continue without origin - direction service will prompt user
      }
    }

    // Generate direction URL
    const directionUrl = generateDirectionUrl(destination, origin, provider)

    // Open directions
    if (openInNewTab) {
      // For automated tests, we can mock window.open
      if (typeof window !== 'undefined') {
        const opened = window.open(directionUrl, '_blank', 'noopener,noreferrer')
        if (!opened) {
          // Fallback if popup blocked
          window.location.href = directionUrl
        }
      }
    } else {
      window.location.href = directionUrl
    }
    
    return createResult.success(undefined)
  } catch (error) {
    const standardError = errorHandler.handle(error as Error, 'getDirections')
    return createResult.error(standardError)
  }
}

// Utility function for testing - mocks geolocation
export function mockGeolocation(mockLocation?: { lat: number; lng: number }) {
  if (typeof window === 'undefined') return

  const mockGeolocation = {
    getCurrentPosition: (success: PositionCallback, error?: PositionErrorCallback) => {
      if (mockLocation) {
        setTimeout(() => {
          success({
            coords: {
              latitude: mockLocation.lat,
              longitude: mockLocation.lng,
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
              toJSON: () => ({})
            },
            timestamp: Date.now(),
            toJSON: () => ({})
          })
        }, 100)
      } else if (error) {
        setTimeout(() => {
          error({
            code: 1, // PERMISSION_DENIED
            message: 'Mocked geolocation denied',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3
          })
        }, 100)
      }
    },
    watchPosition: () => 1,
    clearWatch: () => {}
  }

  Object.defineProperty(navigator, 'geolocation', {
    value: mockGeolocation,
    writable: true
  })
}

// Utility function for testing - mocks window.open
export function mockWindowOpen() {
  if (typeof window === 'undefined') return

  const originalOpen = window.open
  
  window.open = (url?: string | URL, target?: string, features?: string) => {
    console.log('Mock window.open called with:', { url, target, features })
    return null // Simulate popup blocked or return mock window
  }

  return () => {
    window.open = originalOpen
  }
}

// Helper function to validate coordinates
export function isValidCoordinate(coord: { lat: number; lng: number }): boolean {
  return (
    typeof coord.lat === 'number' &&
    typeof coord.lng === 'number' &&
    coord.lat >= -90 &&
    coord.lat <= 90 &&
    coord.lng >= -180 &&
    coord.lng <= 180 &&
    !isNaN(coord.lat) &&
    !isNaN(coord.lng)
  )
}

// Helper function to format coordinates for display
export function formatCoordinates(coord: { lat: number; lng: number }): string {
  return `${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}`
}