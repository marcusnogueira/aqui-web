'use client'

import { useState } from 'react'
import { Database } from '@/types/database'

type VendorStaticLocation = Database['public']['Tables']['vendor_static_locations']['Row']

interface LocationsSectionProps {
  staticLocations: VendorStaticLocation[]
  onAddLocation: (location: { address: string; latitude: number; longitude: number }) => Promise<void>
}

export function LocationsSection({ staticLocations, onAddLocation }: LocationsSectionProps) {
  const [newLocation, setNewLocation] = useState({ address: '', latitude: 0, longitude: 0 })
  const [isAddingLocation, setIsAddingLocation] = useState(false)

  const handleAddLocation = async () => {
    if (!newLocation.address.trim()) return
    
    setIsAddingLocation(true)
    try {
      await onAddLocation(newLocation)
      setNewLocation({ address: '', latitude: 0, longitude: 0 })
    } catch (error) {
      console.error('Error adding location:', error)
    } finally {
      setIsAddingLocation(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Location Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Location</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="location-address" className="block text-sm font-medium text-gray-500 mb-2">
              Address
            </label>
            <input
              id="location-address"
              type="text"
              placeholder="Enter location address"
              value={newLocation.address}
              onChange={(e) => setNewLocation(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-4 py-2 text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleAddLocation}
            disabled={!newLocation.address.trim() || isAddingLocation}
            className="px-6 py-2 rounded-xl font-semibold bg-[#3A938A] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAddingLocation ? 'Adding...' : 'Add Location'}
          </button>
        </div>
      </div>

      {/* Locations Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Your Locations</h2>
        
        {staticLocations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-500">No locations added yet</p>
            <p className="text-sm text-gray-400 mt-1">Add your first location above to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {staticLocations.map((location) => (
              <div 
                key={location.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-[#3A938A] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm font-medium text-[#3A938A]">Static Location</span>
                    </div>
                    <p className="text-gray-900 font-medium mb-1">
                      {location.address || 'No address provided'}
                    </p>
                    {location.latitude && location.longitude && (
                      <p className="text-sm text-gray-500">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Location #{location.id}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}