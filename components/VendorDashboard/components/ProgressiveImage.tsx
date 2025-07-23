'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useImageLazyLoading } from '@/lib/hooks/useImageLazyLoading'

interface ProgressiveImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  fallback?: string
  onLoad?: () => void
  onError?: () => void
  priority?: boolean
  sizes?: string
}

/**
 * Progressive image component with lazy loading and placeholder support
 */
export function ProgressiveImage({
  src,
  alt,
  className = '',
  placeholder,
  fallback,
  onLoad,
  onError,
  priority = false,
  sizes
}: ProgressiveImageProps) {
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  
  const { 
    src: currentSrc, 
    loading, 
    error, 
    loaded, 
    ref 
  } = useImageLazyLoading(src, {
    placeholder,
    fallback,
    rootMargin: priority ? '0px' : '50px'
  })

  useEffect(() => {
    if (loaded && !error) {
      setShowPlaceholder(false)
      onLoad?.()
    } else if (error) {
      onError?.()
    }
  }, [loaded, error, onLoad, onError])

  // Load immediately if priority is set
  useEffect(() => {
    if (priority && ref.current) {
      const img = new Image()
      img.onload = () => {
        setShowPlaceholder(false)
        onLoad?.()
      }
      img.onerror = () => onError?.()
      img.src = src
    }
  }, [priority, src, onLoad, onError, ref])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder/Loading state */}
      {(showPlaceholder || loading) && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 text-gray-400">
            <svg
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Actual image */}
      <img
        ref={ref}
        src={currentSrc || undefined}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded && !error ? 'opacity-100' : 'opacity-0'
        }`}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
      />

      {/* Error state */}
      {error && !fallback && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="w-8 h-8 mx-auto mb-2">
              <svg
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-xs">Failed to load</p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Gallery image component with optimized loading
 */
interface GalleryImageProps extends ProgressiveImageProps {
  index: number
  onDelete?: (index: number) => void
  onEdit?: (index: number) => void
  showControls?: boolean
  caption?: string
}

export function GalleryImage({
  index,
  onDelete,
  onEdit,
  showControls = false,
  caption,
  ...imageProps
}: GalleryImageProps) {
  const [showOverlay, setShowOverlay] = useState(false)

  return (
    <div 
      className="relative group aspect-square"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      <ProgressiveImage
        {...imageProps}
        className="w-full h-full rounded-lg"
      />

      {/* Caption */}
      {caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm rounded-b-lg">
          {caption}
        </div>
      )}

      {/* Controls overlay */}
      {showControls && (showOverlay || 'ontouchstart' in window) && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center space-x-2 rounded-lg">
          {onEdit && (
            <button
              onClick={() => onEdit(index)}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-all"
              aria-label="Edit image"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={() => onDelete(index)}
              className="p-2 bg-red-500 bg-opacity-80 hover:bg-opacity-100 rounded-full text-white transition-all"
              aria-label="Delete image"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}