'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Database } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../Card'

type Vendor = Database['public']['Tables']['vendors']['Row']

interface ProfileSectionProps {
  vendor: Vendor
  businessTypeKeys: string[]
  onSaveProfile: (profileData: any, profileImageFile: File | null, bannerImageFile: File | null) => void
  onSwitchToCustomerMode: () => void
  isSavingProfile: boolean
}

export function ProfileSection({ vendor, businessTypeKeys, onSaveProfile, onSwitchToCustomerMode, isSavingProfile }: ProfileSectionProps) {
  const { t } = useTranslation('dashboard')
  const [profileData, setProfileData] = useState({
    business_name: vendor.business_name || '',
    description: vendor.description || '',
    business_type: vendor.business_type || '',
    subcategory: vendor.subcategory || '',
    contact_email: vendor.contact_email || '',
    phone: vendor.phone || '',
  })
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImageFile(e.target.files[0])
    }
  }

  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBannerImageFile(e.target.files[0])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSaveProfile(profileData, profileImageFile, bannerImageFile)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.title')}</CardTitle>
            <CardDescription>{t('profile.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="business_name" className="block text-sm font-medium text-foreground">{t('profile.businessName')}</label>
                <input type="text" name="business_name" id="business_name" value={profileData.business_name} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-input border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
              </div>
              <div>
                <label htmlFor="business_type" className="block text-sm font-medium text-foreground">{t('profile.businessType')}</label>
                <select name="business_type" id="business_type" value={profileData.business_type} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-input border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm">
                  <option value="">{t('profile.selectType')}</option>
                  {businessTypeKeys.map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-foreground">{t('profile.subcategory')}</label>
                <input type="text" name="subcategory" id="subcategory" value={profileData.subcategory} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-input border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground">{t('profile.description')}</label>
                <textarea name="description" id="description" value={profileData.description} onChange={handleInputChange} rows={3} className="mt-1 block w-full rounded-md bg-input border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"></textarea>
              </div>
              <div>
                <label htmlFor="contact_email" className="block text-sm font-medium text-foreground">{t('profile.contactEmail')}</label>
                <input type="email" name="contact_email" id="contact_email" value={profileData.contact_email} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-input border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground">{t('profile.phone')}</label>
                <input type="tel" name="phone" id="phone" value={profileData.phone} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-input border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
              </div>
              <div>
                <label htmlFor="profile_image" className="block text-sm font-medium text-foreground">{t('profile.profileImage')}</label>
                <input type="file" name="profile_image" id="profile_image" onChange={handleProfileImageChange} className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
              </div>
              <div>
                <label htmlFor="banner_image" className="block text-sm font-medium text-foreground">{t('profile.bannerImages')}</label>
                <input type="file" name="banner_image" id="banner_image" onChange={handleBannerImageChange} className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={isSavingProfile} className="inline-flex justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                  {isSavingProfile ? t('profile.saving') : t('profile.saveChanges')}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.roleManagement')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{t('profile.roleDescription')}</p>
            <button type="button" onClick={onSwitchToCustomerMode} className="w-full inline-flex justify-center rounded-md border border-border bg-secondary py-2 px-4 text-sm font-medium text-secondary-foreground shadow-sm hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              {t('profile.switchToCustomer')}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}