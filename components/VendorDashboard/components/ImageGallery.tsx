'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface GalleryImage {
  url: string
  title?: string
  index: number
}

interface ImageGalleryProps {
  images: string[]
  titles?: string[]
  onDeleteImage: (index: number) => Promise<void>
  onUpdateTitle?: (index: number, title: string) => Promise<void>
  onReorderImages?: (newImages: string[], newTitles: string[]) => Promise<void>
  selectedImages?: Set<number>
  onImageSelect?: (index: number) => void
  onImagePreview?: (index: number) => void
  selectionMode?: boolean
  className?: string
}

export function ImageGallery({ 
  images, 
  titles = [], 
  onDeleteImage, 
  onUpdateTitle,
  onReorderImages,
  selectedImages = new Set(),
  onImageSelect,
  onImagePreview,
  selectionMode = false,
  className = '' 
}: ImageGalleryProps) {
  const { t } = useTranslation('dashboard')
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState<number | null>(null)
  const [tempTitle, setTempTitle] = useState('')
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isReordering, setIsReordering] = useState(false)

  const galleryImages: GalleryImage[] = images.map((url, index) => ({
    url,
    title: titles[index] || '',
    index
  }))

  const handleDeleteImage = async (index: number) => {
    if (deletingIndex !== null) return // Prevent multiple deletes
    
    const confirmed = window.confirm('Are you sure you want to delete this image?')
    if (!confirmed) return

    setDeletingIndex(index)
    try {
      await onDeleteImage(index)
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Failed to delete image. Please try again.')
    } finally {
      setDeletingIndex(null)
    }
  }

  const handleStartEditTitle = (index: number) => {
    setEditingTitle(index)
    setTempTitle(titles[index] || '')
  }

  const handleSaveTitle = async (index: number) => {
    if (!onUpdateTitle) return
    
    try {
      await onUpdateTitle(index, tempTitle)
      setEditingTitle(null)
      setTempTitle('')
    } catch (error) {
      console.error('Error updating title:', error)
      alert('Failed to update caption. Please try again.')
    }
  }

  const handleCancelEditTitle = () => {
    setEditingTitle(null)
    setTempTitle('')
  }

  const openImageModal = (index: number) => {
    setSelectedImage(index)
  }

  const closeImageModal = () => {
    setSelectedImage(null)
  }

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImage === null) return
    
    if (direction === 'prev') {
      setSelectedImage(selectedImage > 0 ? selectedImage - 1 : images.length - 1)
    } else {
      setSelectedImage(selectedImage < images.length - 1 ? selectedImage + 1 : 0)
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!onReorderImages) return
    
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML)
    
    // Add some visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!onReorderImages || draggedIndex === null) return
    
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    if (index !== draggedIndex) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (!onReorderImages || draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    setIsReordering(true)
    
    try {
      // Create new arrays with reordered items
      const newImages = [...images]
      const newTitles = [...titles]
      
      // Remove the dragged item
      const [draggedImage] = newImages.splice(draggedIndex, 1)
      const [draggedTitle] = newTitles.splice(draggedIndex, 1)
      
      // Insert at new position
      newImages.splice(dropIndex, 0, draggedImage)
      newTitles.splice(dropIndex, 0, draggedTitle || '')
      
      await onReorderImages(newImages, newTitles)
    } catch (error) {
      console.error('Error reordering images:', error)
      alert('Failed to reorder images. Please try again.')
    } finally {
      setIsReordering(false)
      setDraggedIndex(null)
      setDragOverIndex(null)
    }
  }

  if (images.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center ${className}`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('gallery.noImagesYet')}</h3>
        <p className="text-gray-500">{t('gallery.uploadFirst')}</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Reordering Indicator */}
      {isReordering && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-500 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-blue-700 text-sm font-medium">Reordering images...</span>
          </div>
        </div>
      )}

      {/* Drag Instructions */}
      {onReorderImages && images.length > 1 && !isReordering && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Drag and drop images to reorder your gallery
          </p>
        </div>
      )}

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {galleryImages.map((image) => (
          <div 
            key={image.index} 
            className={`group relative transition-all duration-200 ${
              draggedIndex === image.index ? 'opacity-50 scale-95' : ''
            } ${
              dragOverIndex === image.index ? 'scale-105 ring-2 ring-[#3A938A] ring-opacity-50' : ''
            }`}
            draggable={onReorderImages && !isReordering}
            onDragStart={(e) => handleDragStart(e, image.index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, image.index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, image.index)}
          >
            {/* Drag Handle */}
            {onReorderImages && (
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <div className="bg-black bg-opacity-50 text-white p-1 rounded cursor-move">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>
              </div>
            )}
            
            {/* Selection Checkbox */}
            {selectionMode && onImageSelect && (
              <div className="absolute top-2 left-2 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onImageSelect(image.index)
                  }}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedImages.has(image.index)
                      ? 'bg-[#3A938A] border-[#3A938A] text-white'
                      : 'bg-white border-gray-300 hover:border-[#3A938A]'
                  }`}
                >
                  {selectedImages.has(image.index) && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>
            )}

            {/* Image Container */}
            <div 
              className={`aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-all ${
                selectedImages.has(image.index) ? 'ring-2 ring-[#3A938A] ring-offset-2' : ''
              }`}
              onClick={() => {
                if (selectionMode && onImageSelect) {
                  onImageSelect(image.index)
                } else if (onImagePreview) {
                  onImagePreview(image.index)
                } else {
                  openImageModal(image.index)
                }
              }}
            >
              <img
                src={image.url}
                alt={image.title || `Gallery image ${image.index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Image Actions */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteImage(image.index)
                }}
                disabled={deletingIndex === image.index}
                className="bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
                title="Delete image"
              >
                {deletingIndex === image.index ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>

            {/* Enhanced Caption with Inline Editing */}
            <div className="mt-2">
              {editingTitle === image.index ? (
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      placeholder={t('gallery.captionPlaceholder')}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A938A] focus:border-transparent"
                      maxLength={100}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveTitle(image.index)
                        } else if (e.key === 'Escape') {
                          handleCancelEditTitle()
                        }
                      }}
                    />
                    <div className="absolute right-2 top-2 text-xs text-gray-400">
                      {tempTitle.length}/100
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Press Enter to save, Esc to cancel</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCancelEditTitle}
                        className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                      >
{t('gallery.cancelCaption')}
                      </button>
                      <button
                        onClick={() => handleSaveTitle(image.index)}
                        className="px-3 py-1 text-xs text-white bg-[#3A938A] hover:bg-[#2d7169] rounded transition-colors font-medium"
                      >
{t('gallery.saveCaption')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="cursor-pointer group/caption relative"
                  onClick={() => onUpdateTitle && handleStartEditTitle(image.index)}
                >
                  {image.title ? (
                    <div className="relative">
                      <p className="text-sm text-gray-700 group-hover/caption:text-[#3A938A] transition-colors pr-6">
                        {image.title}
                      </p>
                      {onUpdateTitle && (
                        <div className="absolute right-0 top-0 opacity-0 group-hover/caption:opacity-100 transition-opacity">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ) : onUpdateTitle ? (
                    <div className="flex items-center gap-1 text-sm text-gray-400 group-hover/caption:text-[#3A938A] transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>{t('gallery.addCaption')}</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImage !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Close Button */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Image */}
            <img
              src={images[selectedImage]}
              alt={titles[selectedImage] || `Gallery image ${selectedImage + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />

            {/* Image Info */}
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="bg-black bg-opacity-50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    {titles[selectedImage] && (
                      <h3 className="text-lg font-medium mb-1">{titles[selectedImage]}</h3>
                    )}
                    <p className="text-sm text-gray-300">
                      Image {selectedImage + 1} of {images.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}