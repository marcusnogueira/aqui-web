'use client'

import { useState } from 'react'
import { Database } from '@/types/database'
import { SubcategoryInput } from '@/components/SubcategoryInput'

type Vendor = Database['public']['Tables']['vendors']['Row']

interface ProfileSectionProps {
  vendor: Vendor
  businessTypeKeys: string[]
  onSaveProfile: (profileData: any, profileImageFile: File | null, bannerImageFile: File | null) => Promise<void>
  onSwitchToCustomerMode: () => void
  isSavingProfile: boolean
}

export function ProfileSection({ 
  vendor, 
  businessTypeKeys, 
  onSaveProfile, 
  onSwitchToCustomerMode,
  isSavingProfile 
}: ProfileSectionProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    business_name: vendor?.business_name || '',
    description: vendor?.description || '',
    business_type: vendor?.business_type || '',
    subcategory: vendor?.subcategory || '',
    contact_email: vendor?.contact_email || '',
    phone: vendor?.phone || ''
  })
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null)

  const handleSaveProfile = async () => {
    await onSaveProfile(profileForm, profileImageFile, bannerImageFile)
    setIsEditingProfile(false)
    setProfileImageFile(null)
    setBannerImageFile(null)
  }

  const handleCancelEdit = () => {
    setIsEditingProfile(false)
    setProfileForm({
      business_name: vendor?.business_name || '',
      description: vendor?.description || '',
      business_type: vendor?.business_type || '',
      subcategory: vendor?.subcategory || '',
      contact_email: vendor?.contact_email || '',
      phone: vendor?.phone || ''
    })
    setProfileImageFile(null)
    setBannerImageFile(null)
  }

  return (
    <div className="space-y-6">
      {/* Business Profile */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Business Profile</h2>
          {!isEditingProfile ? (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#3A938A', color: '#FBF2E3' }}
            >
              Edit Profile
            </button>
          ) : (
            <div className="space-x-2">
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="px-4 py-2 rounded-xl font-semibold bg-[#3A938A] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSavingProfile ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 rounded-xl font-semibold bg-gray-100 text-gray-600 hover:opacity-80 transition-opacity"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        
        {isEditingProfile ? (
          <div className="space-y-4">
            {/* Profile Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Profile Image</label>
              <div className="flex items-center space-x-4">
                {vendor?.profile_image_url && (
                  <img
                    src={vendor.profile_image_url}
                    alt="Current profile"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-mission-teal file:text-white hover:file:bg-mission-teal/90"
                  aria-label="Upload profile image"
                />
              </div>
            </div>
            
            {/* Banner Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Banner Image</label>
              <div className="space-y-2">
                {vendor?.banner_image_url && vendor.banner_image_url.length > 0 && (
                  <img
                    src={vendor.banner_image_url[0]}
                    alt="Current banner"
                    className="w-full h-32 rounded-lg object-cover"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBannerImageFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-mission-teal file:text-white hover:file:bg-mission-teal/90"
                  aria-label="Upload banner image"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="business-name" className="block text-sm font-medium text-gray-500 mb-2">Business Name</label>
                <input
                  id="business-name"
                  type="text"
                  value={profileForm.business_name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, business_name: e.target.value }))}
                  className="w-full px-4 py-2 text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter your business name"
                />
              </div>
              <div>
                <label htmlFor="business-type" className="block text-sm font-medium text-gray-500 mb-2">Business Type</label>
                <select
                  id="business-type"
                  value={profileForm.business_type}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, business_type: e.target.value, subcategory: '' }))}
                  className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Select business type</option>
                  {businessTypeKeys.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <label htmlFor="subcategory" className="block text-sm font-medium text-gray-500 mb-2">Subcategory</label>
              <SubcategoryInput
                businessType={profileForm.business_type}
                value={profileForm.subcategory}
                onChange={(value) => setProfileForm(prev => ({ ...prev, subcategory: value }))}
                className="w-full px-4 py-2 text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="e.g., Street Tacos, Vintage, Zines"
              />
            </div>
            
            <div className="mt-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-500 mb-2">Description</label>
              <textarea
                id="description"
                rows={3}
                value={profileForm.description}
                onChange={(e) => setProfileForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Tell customers about your business..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-gray-500 mb-2">Contact Email</label>
                <input
                  id="contact-email"
                  type="email"
                  value={profileForm.contact_email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, contact_email: e.target.value }))}
                  className="w-full px-4 py-2 text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-500 mb-2">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Display Images */}
            <div className="flex space-x-6">
              {vendor?.profile_image_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                  <img
                    src={vendor.profile_image_url}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                </div>
              )}
              {vendor?.banner_image_url && vendor.banner_image_url.length > 0 && (
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image</label>
                  <img
                    src={vendor.banner_image_url[0]}
                    alt="Banner"
                    className="w-full h-32 rounded-lg object-cover"
                  />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#444444' }}>Business Name</label>
                <p style={{ color: '#222222' }}>{vendor?.business_name || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#444444' }}>Business Type</label>
                <p style={{ color: '#222222' }}>{vendor?.business_type || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#444444' }}>Subcategory</label>
                <p style={{ color: '#222222' }}>{vendor?.subcategory || 'Not provided'}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: '#444444' }}>Description</label>
                <p style={{ color: '#222222' }}>{vendor?.description || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#444444' }}>Contact Email</label>
                <p style={{ color: '#222222' }}>{vendor?.contact_email || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#444444' }}>Phone</label>
                <p style={{ color: '#222222' }}>{vendor?.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Role Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Role Management</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#444444' }}>Current Role</label>
            <p style={{ color: '#222222' }}>Vendor</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Switch to customer mode to browse and discover other vendors in your area.
            </p>
            <button
              onClick={onSwitchToCustomerMode}
              className="px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#3A938A', color: '#FBF2E3' }}
            >
              Switch to Customer Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}