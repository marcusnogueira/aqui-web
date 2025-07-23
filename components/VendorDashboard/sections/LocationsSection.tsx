'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GooglePlacesAutocomplete } from '@/components/GooglePlacesAutocomplete'
import { Database } from '@/types/database'

type VendorStaticLocation = Database['public']['Tables']['vendor_static_locations']['Row']

interface LocationsSectionProps {
  staticLocations: VendorStaticLocation[]
  onAddLocation: (location: { address: string; latitude: number; longitude: number }) => void
}

export function LocationsSection({ staticLocations, onAddLocation }: LocationsSectionProps) {
  const { t } = useTranslation('dashboard')
  const [selectedLocation, setSelectedLocation] = useState<{ address: string; latitude: number; longitude: number } | null>(null)

  const handleAddLocation = () => {
    if (selectedLocation) {
      onAddLocation(selectedLocation)
      setSelectedLocation(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1 text-foreground">{t('locations.title')}</h1>
      <p className="text-muted-foreground mb-4">{t('locations.subtitle')}</p>
      <div className="flex items-center space-x-2 mb-4">
        <div className="flex-grow">
          <GooglePlacesAutocomplete
            onSelectLocation={(lat, lng, address) => setSelectedLocation({ latitude: lat, longitude: lng, address })}
            placeholder={t('locations.searchAddress')}
          />
        </div>
        <button
          onClick={handleAddLocation}
          disabled={!selectedLocation}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-muted"
        >
          {t('locations.addLocation')}
        </button>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2 text-foreground">{t('locations.addedLocations')}</h2>
        {staticLocations.length > 0 ? (
          <ul className="space-y-2">
            {staticLocations.map(location => (
              <li key={location.id} className="bg-card p-2 rounded-lg shadow text-sm text-card-foreground">{location.address}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">{t('locations.noLocations')}</p>
        )}
      </div>
    </div>
  )
}
