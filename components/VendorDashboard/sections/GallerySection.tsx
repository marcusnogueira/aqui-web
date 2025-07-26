'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { Database } from '@/lib/database.types'
import { ImageGallery } from '../components/ImageGallery'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '../Card'
import {
  UploadCloudIcon,
  XIcon,
  ImageIcon,
  HardDriveIcon,
  PackageIcon
} from 'lucide-react'

type Vendor = Database['public']['Tables']['vendors']['Row']

interface GallerySectionProps {
  vendor: Vendor
  onVendorUpdate: (vendor: Vendor) => void
}

const MAX_SLOTS = 10

export function GallerySection({ vendor, onVendorUpdate }: GallerySectionProps) {
  const { t } = useTranslation('dashboard')
  const supabase = useSupabase()
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const images = vendor.gallery_images || []
  const titles = vendor.gallery_titles || []
  const availableSlots = MAX_SLOTS - images.length

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    if (files.length > availableSlots) {
      alert(`You can only upload ${availableSlots} more image(s).`)
      return
    }

    setUploading(true)
    try {
      // Validate file sizes before uploading
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds the 5MB limit.`)
        }
      }

      // Create FormData for the API request
      const formData = new FormData()
      formData.append('vendorId', vendor.id)
      formData.append('imageType', 'gallery') // ← Added required imageType parameter
      Array.from(files).forEach((file) => {
        formData.append('files', file)
      })

      // Upload via API route
      const response = await fetch('/api/vendor/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies for authentication
        headers: {
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload images')
      }

      const result = await response.json()
      if (result.vendor) {
        onVendorUpdate(result.vendor)
      }

    } catch (error) {
      console.error('Error uploading images:', error)
      alert(
        `Failed to upload images. ${
          error instanceof Error ? error.message : ''
        }`
      )
    } finally {
      setUploading(false)
    }
  }

  const handleImageDelete = async (index: number) => {
    const imageUrl = images[index]
    setDeleting(imageUrl)
    try {
      // Delete via API route
      const response = await fetch(
        `/api/vendor/delete-image?vendorId=${vendor.id}&imageUrl=${encodeURIComponent(imageUrl)}&imageType=gallery`,
        {
          method: 'DELETE',
          credentials: 'include', // Include cookies for authentication
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete image')
      }

      const result = await response.json()
      if (result.vendor) {
        onVendorUpdate(result.vendor)
      }

    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Failed to delete image.')
    } finally {
      setDeleting(null)
    }
  }

  const handleCaptionUpdate = async (index: number, caption: string) => {
    try {
      const response = await fetch('/api/vendors/gallery/captions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          imageIndex: index,
          caption: caption
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update caption')
      }

      // Update local state
      const updatedTitles = [...titles]
      while (updatedTitles.length <= index) {
        updatedTitles.push('')
      }
      updatedTitles[index] = caption

      const updatedVendor = {
        ...vendor,
        gallery_titles: updatedTitles
      }
      onVendorUpdate(updatedVendor)

    } catch (error) {
      console.error('Error updating caption:', error)
      throw error // Re-throw to let ImageGallery handle the error display
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Gallery Management */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('gallery.title')}</CardTitle>
            <CardDescription>{t('gallery.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <UploadCloudIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                <label
                  htmlFor="image-upload"
                  className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                >
                  <span>{t('gallery.dropOrBrowse')}</span>
                  <input
                    id="image-upload"
                    name="image-upload"
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={handleImageUpload}
                    disabled={uploading || availableSlots === 0}
                  />
                </label>
              </p>
              <p className="text-xs text-muted-foreground">
                {t('gallery.fileTypes')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('gallery.yourGallery')}</CardTitle>
            <CardDescription>{t('gallery.galleryDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ImageGallery
              images={images}
              titles={titles}
              onDeleteImage={handleImageDelete}
              onUpdateTitle={handleCaptionUpdate}
              className="min-h-[200px]"
            />
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Statistics */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>{t('gallery.statistics')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <PackageIcon className="w-5 h-5 mr-3 text-muted-foreground" />
                <span className="text-sm font-medium">{t('gallery.imagesUsed')}</span>
              </div>
              <span className="text-sm font-semibold">{images.length} / {MAX_SLOTS}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <HardDriveIcon className="w-5 h-5 mr-3 text-muted-foreground" />
                <span className="text-sm font-medium">{t('gallery.storageUsed')}</span>
              </div>
              <span className="text-sm font-semibold">-- MB</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(images.length / MAX_SLOTS) * 100}%` }}></div>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              {t('gallery.slotsAvailable', { count: availableSlots })}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
