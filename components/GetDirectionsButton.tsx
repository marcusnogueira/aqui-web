'use client'

import { useState } from 'react'
import { Navigation, MapPin, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getDirections, getDirectionProvider } from '@/lib/directions'

interface GetDirectionsButtonProps {
  destination: { lat: number; lng: number }
  vendorName: string
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  showProvider?: boolean
}

export function GetDirectionsButton({
  destination,
  vendorName,
  className = '',
  variant = 'outline',
  size = 'md',
  showProvider = false
}: GetDirectionsButtonProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'success' | 'denied'>('idle')
  
  const provider = getDirectionProvider()
  const providerName = provider === 'google' ? 'Google Maps' : 'OpenStreetMap'

  const handleGetDirections = async () => {
    setIsLoading(true)
    setLocationStatus('requesting')

    try {
      await getDirections(destination, {
        provider,
        useCurrentLocation: true,
        openInNewTab: true,
        onLocationSuccess: (location) => {
          setLocationStatus('success')
          console.log('Got user location:', location)
        },
        onLocationError: (error) => {
          setLocationStatus('denied')
          console.log('Location access denied or failed:', error.message)
          // Still proceed to open directions without origin
        }
      })
    } catch (error) {
      console.error('Error getting directions:', error)
    } finally {
      setIsLoading(false)
      // Reset status after a delay
      setTimeout(() => setLocationStatus('idle'), 3000)
    }
  }

  // Variant styles
  const variantStyles = {
    primary: 'bg-mission-teal text-white hover:bg-bay-cypress',
    secondary: 'bg-muted text-muted-foreground hover:bg-muted/80',
    outline: 'border border-mission-teal text-mission-teal hover:bg-mission-teal hover:text-white'
  }

  // Size styles
  const sizeStyles = {
    sm: 'py-1 px-2 text-xs',
    md: 'py-2 px-4 text-sm',
    lg: 'py-3 px-6 text-base'
  }

  // Status messages
  const getStatusMessage = () => {
    switch (locationStatus) {
      case 'requesting':
        return 'Getting your location...'
      case 'success':
        return 'Opening directions...'
      case 'denied':
        return 'Opening directions...'
      default:
        return t('get_directions')
    }
  }

  // Status icons
  const getStatusIcon = () => {
    if (isLoading) {
      return (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
      )
    }
    
    switch (locationStatus) {
      case 'success':
        return <ExternalLink className="w-4 h-4" />
      case 'denied':
        return <MapPin className="w-4 h-4" />
      default:
        return <MapPin className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handleGetDirections}
        disabled={isLoading}
        className={`
          w-full sm:w-auto flex items-center justify-center space-x-2 
          rounded-lg font-medium transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        title={`${t('get_directions')} to ${vendorName} via ${providerName}`}
      >
        {getStatusIcon()}
        <span>{getStatusMessage()}</span>
      </button>
      
      {showProvider && (
        <p className="text-xs text-muted-foreground text-center">
          via {providerName}
        </p>
      )}
      
      {locationStatus === 'denied' && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 text-center">
          Location access denied - directions will open without your current location
        </p>
      )}
    </div>
  )
}

// Compact version for use in maps or tight spaces
export function GetDirectionsButtonCompact({
  destination,
  vendorName,
  className = ''
}: Pick<GetDirectionsButtonProps, 'destination' | 'vendorName' | 'className'>) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleGetDirections = async () => {
    setIsLoading(true)
    
    try {
      await getDirections(destination, {
        useCurrentLocation: true,
        openInNewTab: true
      })
    } catch (error) {
      console.error('Error getting directions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleGetDirections}
      disabled={isLoading}
      className={`
        inline-flex items-center justify-center
        w-8 h-8 rounded-full
        bg-mission-teal text-white
        hover:bg-bay-cypress
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={`Get directions to ${vendorName}`}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
      ) : (
        <Navigation className="w-4 h-4" />
      )}
    </button>
  )
}