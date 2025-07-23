'use client'

import { useState, useEffect } from 'react'
import { ImageUploader } from '../components/ImageUploader'
import { ImageGallery } from '../components/ImageGallery'
import { toast } from 'react-hot-toast'

interface GallerySectionProps {
  vendor: {
    id: string
    gallery_images?: string[]
    gallery_titles?: string[]
  }
  onVendorUpdate: (updatedVendor: any) => void
}

interface GalleryStats {
  imageCount: number
  storageUsed: string
  maxImages: number
  remainingSlots: number
  storagePercentage: number
}

interface ImageMetadata {
  uploadDate?: string
  fileSize?: string
  dimensions?: string
  fileName?: string
}

interface ImagePreviewModalProps {
  imageUrl: string
  imageTitle?: string
  imageIndex: number
  totalImages: number
  metadata?: ImageMetadata
  onClose: () => void
  onNavigate: (direction: 'prev' | 'next') => void
  onReplace: (index: number, file: File) => void
}

// Image Preview Modal Component
function ImagePreviewModal({ 
  imageUrl, 
  imageTitle, 
  imageIndex, 
  totalImages, 
  metadata,
  onClose, 
  onNavigate,
  onReplace 
}: ImagePreviewModalProps) {
  const [isReplacing, setIsReplacing] = useState(false)
  const fileInputRef = useState<HTMLInputElement | null>(null)[0]

  const handleReplaceClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/webp'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        setIsReplacing(true)
        onReplace(imageIndex, file)
      }
    }
    input.click()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowLeft') {
      onNavigate('prev')
    } else if (e.key === 'ArrowRight') {
      onNavigate('next')
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div 
        className="relative max-w-6xl max-h-full bg-white rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4 z-10">
          <div className="flex items-center justify-between text-white">
            <div>
              <h3 className="text-lg font-medium">
                {imageTitle || `Image ${imageIndex + 1}`}
              </h3>
              <p className="text-sm text-gray-300">
                {imageIndex + 1} of {totalImages}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReplaceClick}
                disabled={isReplacing}
                className="px-3 py-1.5 text-sm bg-[#3A938A] text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isReplacing ? 'Replacing...' : 'Replace'}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        {totalImages > 1 && (
          <>
            <button
              onClick={() => onNavigate('prev')}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => onNavigate('next')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image */}
        <div className="flex items-center justify-center min-h-[400px] max-h-[80vh]">
          <img
            src={imageUrl}
            alt={imageTitle || `Gallery image ${imageIndex + 1}`}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Enhanced Footer with Metadata */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
          <div className="text-white">
            {/* Image Title */}
            {imageTitle && (
              <h4 className="text-lg font-medium mb-3">{imageTitle}</h4>
            )}
            
            {/* Metadata Grid */}
            {metadata && (
              <div className="bg-black/30 rounded-lg p-4 backdrop-blur-sm">
                <h5 className="text-sm font-medium text-gray-200 mb-3 uppercase tracking-wide">Image Details</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {metadata.uploadDate && (
                    <div className="flex flex-col">
                      <span className="text-gray-300 text-xs uppercase tracking-wide mb-1">Uploaded</span>
                      <p className="font-medium">{metadata.uploadDate}</p>
                    </div>
                  )}
                  {metadata.fileSize && (
                    <div className="flex flex-col">
                      <span className="text-gray-300 text-xs uppercase tracking-wide mb-1">File Size</span>
                      <p className="font-medium">{metadata.fileSize}</p>
                    </div>
                  )}
                  {metadata.dimensions && (
                    <div className="flex flex-col">
                      <span className="text-gray-300 text-xs uppercase tracking-wide mb-1">Dimensions</span>
                      <p className="font-medium">{metadata.dimensions}</p>
                    </div>
                  )}
                  {metadata.fileName && (
                    <div className="flex flex-col">
                      <span className="text-gray-300 text-xs uppercase tracking-wide mb-1">File Name</span>
                      <p className="font-medium truncate" title={metadata.fileName}>
                        {metadata.fileName}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Additional Actions */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/20">
                  <div className="text-xs text-gray-300">
                    Position {imageIndex + 1} of {totalImages} in gallery
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(imageUrl)
                          toast.success('Image URL copied to clipboard')
                        } catch (error) {
                          toast.error('Failed to copy URL')
                        }
                      }}
                      className="px-2 py-1 text-xs bg-white/20 hover:bg-white/30 rounded transition-colors"
                    >
                      Copy URL
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function GallerySection({ vendor, onVendorUpdate }: GallerySectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set())
  const [showImageModal, setShowImageModal] = useState<number | null>(null)
  const [imageMetadata, setImageMetadata] = useState<Map<number, ImageMetadata>>(new Map())
  const [inlineCaptionEdit, setInlineCaptionEdit] = useState<number | null>(null)
  const [tempCaption, setTempCaption] = useState('')

  const galleryImages = vendor.gallery_images || []
  const galleryTitles = vendor.gallery_titles || []
  const maxImages = 10

  // Calculate gallery statistics
  const [galleryStats, setGalleryStats] = useState<GalleryStats>({
    imageCount: galleryImages.length,
    storageUsed: 'Calculating...',
    maxImages,
    remainingSlots: maxImages - galleryImages.length,
    storagePercentage: 0
  })

  // Calculate storage usage and statistics
  useEffect(() => {
    const calculateStats = () => {
      const imageCount = galleryImages.length
      const remainingSlots = maxImages - imageCount
      
      // Rough estimate: average 2MB per image
      const estimatedSizeMB = imageCount * 2
      const maxStorageMB = maxImages * 2 // Assume max 2MB per slot
      const storagePercentage = maxStorageMB > 0 ? (estimatedSizeMB / maxStorageMB) * 100 : 0
      
      const storageUsed = estimatedSizeMB > 1024 
        ? `${(estimatedSizeMB / 1024).toFixed(1)} GB`
        : `${estimatedSizeMB} MB`

      setGalleryStats({
        imageCount,
        storageUsed: imageCount > 0 ? storageUsed : '0 MB',
        maxImages,
        remainingSlots,
        storagePercentage: Math.min(storagePercentage, 100)
      })
    }

    calculateStats()
  }, [galleryImages.length, maxImages])

  const handleImageUpload = async (files: File[]) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('images', file)
      })

      const response = await fetch('/api/vendors/gallery/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      // Update vendor data with new images
      const updatedVendor = {
        ...vendor,
        gallery_images: [...galleryImages, ...result.imageUrls],
        gallery_titles: [...galleryTitles, ...new Array(result.imageUrls.length).fill('')]
      }

      onVendorUpdate(updatedVendor)
      toast.success(`Successfully uploaded ${files.length} image${files.length !== 1 ? 's' : ''}`)

    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload images')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteImage = async (index: number) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/vendors/gallery/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageIndex: index })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Delete failed')
      }

      // Update vendor data by removing the image
      const updatedImages = galleryImages.filter((_, i) => i !== index)
      const updatedTitles = galleryTitles.filter((_, i) => i !== index)

      const updatedVendor = {
        ...vendor,
        gallery_images: updatedImages,
        gallery_titles: updatedTitles
      }

      onVendorUpdate(updatedVendor)
      toast.success('Image deleted successfully')

      // Clear selection if deleted image was selected
      setSelectedImages(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
        // Adjust indices for remaining selected images
        const adjustedSet = new Set<number>()
        newSet.forEach(selectedIndex => {
          if (selectedIndex > index) {
            adjustedSet.add(selectedIndex - 1)
          } else if (selectedIndex < index) {
            adjustedSet.add(selectedIndex)
          }
        })
        return adjustedSet
      })

    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete image')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateTitle = async (index: number, title: string) => {
    try {
      const response = await fetch('/api/vendors/gallery/update-title', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageIndex: index, title })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Update failed')
      }

      // Update vendor data with new title
      const updatedTitles = [...galleryTitles]
      while (updatedTitles.length <= index) {
        updatedTitles.push('')
      }
      updatedTitles[index] = title

      const updatedVendor = {
        ...vendor,
        gallery_titles: updatedTitles
      }

      onVendorUpdate(updatedVendor)
      toast.success('Caption updated successfully')

    } catch (error) {
      console.error('Update title error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update caption')
    }
  }

  const handleReorderImages = async (newImages: string[], newTitles: string[]) => {
    try {
      const response = await fetch('/api/vendors/gallery/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          imageUrls: newImages, 
          imageTitles: newTitles 
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Reorder failed')
      }

      // Update vendor data with new order
      const updatedVendor = {
        ...vendor,
        gallery_images: newImages,
        gallery_titles: newTitles
      }

      onVendorUpdate(updatedVendor)
      toast.success('Images reordered successfully')

    } catch (error) {
      console.error('Reorder error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reorder images')
    }
  }

  const handleSelectImage = (index: number) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedImages.size === galleryImages.length) {
      setSelectedImages(new Set())
    } else {
      setSelectedImages(new Set(galleryImages.map((_, index) => index)))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedImages.size === 0) return

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedImages.size} selected image${selectedImages.size !== 1 ? 's' : ''}?`)
    if (!confirmed) return

    setIsLoading(true)
    try {
      // Sort indices in descending order to delete from end to beginning
      const sortedIndices = Array.from(selectedImages).sort((a, b) => b - a)
      
      for (const index of sortedIndices) {
        const response = await fetch('/api/vendors/gallery/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ imageIndex: index })
        })

        const result = await response.json()
        if (!result.success) {
          throw new Error(`Failed to delete image ${index + 1}: ${result.error}`)
        }
      }

      // Refresh vendor data by removing selected images
      const updatedImages = galleryImages.filter((_, index) => !selectedImages.has(index))
      const updatedTitles = galleryTitles.filter((_, index) => !selectedImages.has(index))

      const updatedVendor = {
        ...vendor,
        gallery_images: updatedImages,
        gallery_titles: updatedTitles
      }

      onVendorUpdate(updatedVendor)
      setSelectedImages(new Set())
      toast.success(`Successfully deleted ${sortedIndices.length} image${sortedIndices.length !== 1 ? 's' : ''}`)

    } catch (error) {
      console.error('Bulk delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete selected images')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImagePreview = (index: number) => {
    setShowImageModal(index)
    // Generate metadata for the image
    generateImageMetadata(index)
  }

  const handleModalNavigate = (direction: 'prev' | 'next') => {
    if (showImageModal === null) return
    
    let newIndex: number
    if (direction === 'prev') {
      newIndex = showImageModal > 0 ? showImageModal - 1 : galleryImages.length - 1
    } else {
      newIndex = showImageModal < galleryImages.length - 1 ? showImageModal + 1 : 0
    }
    
    setShowImageModal(newIndex)
    generateImageMetadata(newIndex)
  }

  const handleReplaceImage = async (index: number, file: File) => {
    setIsLoading(true)
    try {
      // First delete the old image
      await handleDeleteImage(index)
      
      // Then upload the new image at the same position
      const formData = new FormData()
      formData.append('images', file)

      const response = await fetch('/api/vendors/gallery/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      // Insert the new image at the same index
      const updatedImages = [...galleryImages]
      const updatedTitles = [...galleryTitles]
      
      updatedImages.splice(index, 0, result.imageUrls[0])
      updatedTitles.splice(index, 0, '')

      const updatedVendor = {
        ...vendor,
        gallery_images: updatedImages,
        gallery_titles: updatedTitles
      }

      onVendorUpdate(updatedVendor)
      toast.success('Image replaced successfully')
      setShowImageModal(null)

    } catch (error) {
      console.error('Replace image error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to replace image')
    } finally {
      setIsLoading(false)
    }
  }

  const generateImageMetadata = async (index: number) => {
    const imageUrl = galleryImages[index]
    const fileName = imageUrl.split('/').pop() || 'unknown'
    
    // Initial metadata with loading states
    const initialMetadata: ImageMetadata = {
      uploadDate: 'Loading...', 
      fileSize: 'Loading...', 
      dimensions: 'Loading...', 
      fileName: fileName
    }
    
    setImageMetadata(prev => new Map(prev).set(index, initialMetadata))

    try {
      // Get image dimensions
      const img = new Image()
      const imageLoadPromise = new Promise<{width: number, height: number}>((resolve, reject) => {
        img.onload = () => resolve({ width: img.width, height: img.height })
        img.onerror = reject
        img.src = imageUrl
      })

      // Estimate file size by fetching headers (if CORS allows)
      let estimatedSize = '~2.1 MB' // Default estimate
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' })
        const contentLength = response.headers.get('content-length')
        if (contentLength) {
          const sizeInBytes = parseInt(contentLength)
          const sizeInMB = sizeInBytes / (1024 * 1024)
          estimatedSize = sizeInMB > 1 
            ? `${sizeInMB.toFixed(1)} MB`
            : `${(sizeInBytes / 1024).toFixed(0)} KB`
        }
      } catch (error) {
        // Fallback to estimate if HEAD request fails
        console.log('Could not fetch file size, using estimate')
      }

      // Wait for image to load to get dimensions
      const { width, height } = await imageLoadPromise

      // Generate upload date (mock - in real app this would come from database)
      const uploadDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
      const formattedDate = uploadDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })

      const finalMetadata: ImageMetadata = {
        uploadDate: formattedDate,
        fileSize: estimatedSize,
        dimensions: `${width} × ${height}px`,
        fileName: fileName
      }

      setImageMetadata(prev => new Map(prev).set(index, finalMetadata))
    } catch (error) {
      console.error('Error loading image metadata:', error)
      // Fallback metadata
      const fallbackMetadata: ImageMetadata = {
        uploadDate: 'Unknown',
        fileSize: '~2.1 MB',
        dimensions: 'Unknown',
        fileName: fileName
      }
      setImageMetadata(prev => new Map(prev).set(index, fallbackMetadata))
    }
  }

  const handleStartInlineCaptionEdit = (index: number) => {
    setInlineCaptionEdit(index)
    setTempCaption(galleryTitles[index] || '')
  }

  const handleSaveInlineCaption = async (index: number) => {
    try {
      await handleUpdateTitle(index, tempCaption)
      setInlineCaptionEdit(null)
      setTempCaption('')
    } catch (error) {
      // Error handling is done in handleUpdateTitle
    }
  }

  const handleCancelInlineCaptionEdit = () => {
    setInlineCaptionEdit(null)
    setTempCaption('')
  }

  return (
    <div className="space-y-6">
      {/* Section Header with Enhanced Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">Gallery Management</h2>
              {galleryStats.imageCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#3A938A] text-white">
                  {galleryStats.imageCount} image{galleryStats.imageCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-gray-600 mb-4">Upload and manage images to showcase your offerings to customers</p>
            
            {/* Quick Upload Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => document.getElementById('gallery-file-input')?.click()}
                disabled={isLoading || galleryStats.remainingSlots === 0}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#3A938A] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Quick Upload
              </button>
              {galleryStats.remainingSlots === 0 && (
                <span className="text-sm text-amber-600 font-medium">Gallery is full</span>
              )}
            </div>
          </div>
          
          {/* Enhanced Gallery Statistics */}
          <div className="lg:w-80">
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Gallery Statistics</h3>
              
              {/* Image Count */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Images Used</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {galleryStats.imageCount}/{galleryStats.maxImages}
                  </span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#3A938A] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(galleryStats.imageCount / galleryStats.maxImages) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Storage Usage */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Storage Used</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{galleryStats.storageUsed}</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        galleryStats.storagePercentage > 80 ? 'bg-red-500' : 
                        galleryStats.storagePercentage > 60 ? 'bg-amber-500' : 'bg-[#3A938A]'
                      }`}
                      style={{ width: `${galleryStats.storagePercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Remaining Slots */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Available Slots</span>
                <span className={`text-sm font-medium ${
                  galleryStats.remainingSlots === 0 ? 'text-red-600' : 
                  galleryStats.remainingSlots <= 2 ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {galleryStats.remainingSlots} remaining
                </span>
              </div>

              {/* Storage Warning */}
              {galleryStats.storagePercentage > 80 && (
                <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded">
                  <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-xs text-amber-700">Storage nearly full</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Bulk Operations */}
        {galleryImages.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <h4 className="text-sm font-medium text-gray-700">Bulk Operations</h4>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-[#3A938A] hover:text-[#2d7169] font-medium transition-colors"
                  >
                    {selectedImages.size === galleryImages.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedImages.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {selectedImages.size} of {galleryImages.length} selected
                      </span>
                      <div className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span className="text-xs text-gray-400">
                        ~{(selectedImages.size * 2).toFixed(1)}MB
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedImages.size > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedImages(new Set())}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={isLoading}
                    className="px-4 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Selected ({selectedImages.size})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input for Quick Upload */}
      <input
        id="gallery-file-input"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={async (e) => {
          const files = e.target.files
          if (files && files.length > 0) {
            await handleImageUpload(Array.from(files))
            e.target.value = '' // Reset input
          }
        }}
        className="hidden"
      />

      {/* Image Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upload New Images</h3>
          <div className="text-sm text-gray-500">
            {galleryStats.remainingSlots} slot{galleryStats.remainingSlots !== 1 ? 's' : ''} available
          </div>
        </div>
        <ImageUploader
          onUpload={handleImageUpload}
          maxImages={maxImages}
          currentImageCount={galleryImages.length}
          existingImages={galleryImages}
          disabled={isLoading || galleryStats.remainingSlots === 0}
        />
      </div>

      {/* Gallery Display */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Gallery</h3>
          {galleryImages.length > 0 && (
            <span className="text-sm text-gray-500">
              {galleryImages.length} image{galleryImages.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <ImageGallery
          images={galleryImages}
          titles={galleryTitles}
          onDeleteImage={handleDeleteImage}
          onUpdateTitle={handleUpdateTitle}
          onReorderImages={handleReorderImages}
          selectedImages={selectedImages}
          onImageSelect={handleSelectImage}
          onImagePreview={handleImagePreview}
          selectionMode={selectedImages.size > 0 || galleryImages.length > 1}
        />
      </div>

      {/* Image Preview Modal */}
      {showImageModal !== null && (
        <ImagePreviewModal
          imageUrl={galleryImages[showImageModal]}
          imageTitle={galleryTitles[showImageModal]}
          imageIndex={showImageModal}
          totalImages={galleryImages.length}
          metadata={imageMetadata.get(showImageModal)}
          onClose={() => setShowImageModal(null)}
          onNavigate={handleModalNavigate}
          onReplace={handleReplaceImage}
        />
      )}
    </div>
  )
}