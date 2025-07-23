'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
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
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const images = vendor.banner_image_url || []
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
      const session = await supabase.auth.getSession()
      if (!session.data.session?.user) throw new Error('Not authenticated')

      const uploadPromises = Array.from(files).map(async (file) => {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds the 5MB limit.`)
        }

        const ext = file.name.split('.').pop()
        const fileName = `${vendor.id}/${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('vendor-images')
          .upload(fileName, file)
        if (uploadError) throw uploadError

        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('vendor-images')
          .createSignedUrl(fileName, 60 * 60 * 24 * 7) // 7 days

        if (urlError) throw urlError
        return signedUrlData.signedUrl
      })

      const newImageUrls = await Promise.all(uploadPromises)
      const updatedBannerUrls = [...images, ...newImageUrls]

      const { data, error: updateError } = await supabase
        .from('vendors')
        .update({ banner_image_url: updatedBannerUrls })
        .eq('id', vendor.id)
        .select()
        .single()

      if (updateError) throw updateError
      if (data) onVendorUpdate(data)

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

  const handleImageDelete = async (imageUrl: string) => {
    setDeleting(imageUrl)
    try {
      const fileName = imageUrl.split('/').pop()
      if (!fileName) return

      const { error: removeError } = await supabase.storage
        .from('vendor-images')
        .remove([`${vendor.id}/${fileName}`])
      if (removeError) throw removeError

      const updatedBannerUrls = images.filter((url) => url !== imageUrl)
      const { data, error: updateError } = await supabase
        .from('vendors')
        .update({ banner_image_url: updatedBannerUrls })
        .eq('id', vendor.id)
        .select()
        .single()

      if (updateError) throw updateError
      if (data) onVendorUpdate(data)

    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Failed to delete image.')
    } finally {
      setDeleting(null)
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
            {images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((url, index) => (
                  <div
                    key={index}
                    className="relative group aspect-square"
                  >
                    <img
                      src={url}
                      alt={`Vendor image ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                      <button
                        onClick={() => handleImageDelete(url)}
                        disabled={deleting === url}
                        className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-red-600 hover:bg-red-700 rounded-full p-2"
                        aria-label="Delete image"
                      >
                        {deleting === url ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        ) : (
                          <XIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-foreground">
                  {t('gallery.noImagesYet')}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('gallery.uploadFirst')}
                </p>
              </div>
            )}
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
