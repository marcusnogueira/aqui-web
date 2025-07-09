'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, signOut } from '@/lib/supabase'
import { clientAuth } from '@/lib/auth-helpers'
import GooglePlacesAutocomplete from '@/components/GooglePlacesAutocomplete'
import { SubcategoryInput } from '@/components/SubcategoryInput'

export default function VendorOnboardingPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()
  
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: '',
    subcategory: '',
    description: '',
    phone: '',
    contact_email: '',
    address: ''
  })
  
  const [placeData, setPlaceData] = useState<{
    place_id?: string
    latitude?: number
    longitude?: number
    address_components?: google.maps.GeocoderAddressComponent[]
  }>({})
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
      return
    }
    
    setUser(user)
    setFormData(prev => ({ ...prev, contact_email: user.email || '' }))
    
    // Check if user already has vendor profile
    const hasVendor = await clientAuth.hasVendorProfile(user.id)
    if (hasVendor) {
      router.push('/vendor/dashboard')
    }
  }

  const businessTypes = [
    'Food & Beverage',
    'Fashion & Apparel',
    'Arts & Crafts',
    'Mobile Services',
    'Beauty & Wellness',
    'Electronics & Tech',
    'Books & Media',
    'Plants & Flowers',
    'Vintage & Antiques',
    'Jewelry & Accessories',
    'Pop-up Shop',
    'Mobile Vendor',
    'Market Stall',
    'Street Vendor',
    'Other'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubcategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, subcategory: value }))
  }

  const handleAddressChange = (address: string) => {
    setFormData(prev => ({ ...prev, address }))
  }

  const handlePlaceSelect = (place: any) => {
    setPlaceData({
      place_id: place.place_id,
      latitude: place.geometry?.location?.lat(),
      longitude: place.geometry?.location?.lng(),
      address_components: place.address_components
    })
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    setError('')

    try {
      // Combine form data with place data
      const vendorData = {
        ...formData,
        latitude: placeData.latitude,
        longitude: placeData.longitude,
      }
      
      await clientAuth.becomeVendor(vendorData)

      // Navigate to vendor dashboard
      router.push('/vendor/dashboard?onboarding=complete')
    } catch (error: any) {
      console.error('Error creating vendor:', error)
      setError(error.message || 'Failed to create vendor profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-mission-teal"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <span className="mr-2">←</span>
              Back
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            >
              Sign Out
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to AQUI Vendors!</h1>
          <p className="text-gray-600 mt-2">
            Let's set up your business profile to start connecting with your community.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Business Name */}
            <div>
              <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                id="business_name"
                name="business_name"
                required
                value={formData.business_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mission-teal focus:border-transparent"
                placeholder="Enter your business name"
              />
            </div>

            {/* Business Type */}
            <div>
              <label htmlFor="business_type" className="block text-sm font-medium text-gray-700 mb-2">
                Business Type *
              </label>
              <select
                id="business_type"
                name="business_type"
                required
                value={formData.business_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mission-teal focus:border-transparent"
              >
                <option value="">Select business type</option>
                {businessTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            {formData.business_type && (
              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory
                </label>
                <SubcategoryInput
                  id="subcategory"
                  value={formData.subcategory}
                  onChange={handleSubcategoryChange}
                  businessType={formData.business_type}
                  placeholder="e.g., Street Tacos, Vintage Clothing, Handmade Jewelry"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mission-teal focus:border-transparent"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Business Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mission-teal focus:border-transparent"
                placeholder="Describe your business, what you offer, and what makes you unique..."
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mission-teal focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
               <div>
                <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  id="contact_email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mission-teal focus:border-transparent"
                  placeholder="contact@example.com"
                />
              </div>
            </div>
            
            <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address
                </label>
                <GooglePlacesAutocomplete
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleAddressChange}
                  onPlaceSelect={handlePlaceSelect}
                  placeholder="Start typing your business address..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mission-teal focus:border-transparent"
                />
                {placeData.latitude && placeData.longitude && (
                  <div className="mt-1 text-xs text-gray-500">
                    📍 Location confirmed: {placeData.latitude.toFixed(6)}, {placeData.longitude.toFixed(6)}
                  </div>
                )}
              </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-mission-teal text-white py-3 px-4 rounded-md hover:bg-mission-teal/90 focus:outline-none focus:ring-2 focus:ring-mission-teal focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? 'Creating Your Profile...' : 'Complete Setup'}
              </button>
            </div>
          </form>
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">What's Next?</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Your profile is pending approval from our team.</li>
            <li>• Once approved, you can start your first live session!</li>
            <li>• In the meantime, you can add more details to your profile from the dashboard.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
