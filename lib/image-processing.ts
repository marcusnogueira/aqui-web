/**
 * Image processing utilities for gallery management
 * Handles compression, resizing, and validation
 */

export interface ImageProcessingOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

export interface ProcessedImage {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
  width: number
  height: number
}

/**
 * Compress and resize an image file
 */
export async function compressImage(
  file: File, 
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    format = 'jpeg'
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img
      
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height
        
        if (width > height) {
          width = Math.min(width, maxWidth)
          height = width / aspectRatio
        } else {
          height = Math.min(height, maxHeight)
          width = height * aspectRatio
        }
      }

      // Set canvas dimensions
      canvas.width = width
      canvas.height = height

      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'))
            return
          }

          const compressedFile = new File(
            [blob], 
            file.name.replace(/\.[^/.]+$/, `.${format === 'jpeg' ? 'jpg' : format}`),
            { 
              type: `image/${format}`,
              lastModified: Date.now()
            }
          )

          resolve({
            file: compressedFile,
            originalSize: file.size,
            compressedSize: blob.size,
            compressionRatio: (1 - blob.size / file.size) * 100,
            width: Math.round(width),
            height: Math.round(height)
          })
        },
        `image/${format}`,
        quality
      )
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Validate image file type and size
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`
    }
  }

  return { valid: true }
}

/**
 * Generate a hash for duplicate detection
 */
export async function generateImageHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Detect duplicate images in a file list
 */
export async function detectDuplicates(files: File[]): Promise<{
  duplicates: { file: File; duplicateOf: number }[]
  unique: File[]
}> {
  const hashes = new Map<string, number>()
  const duplicates: { file: File; duplicateOf: number }[] = []
  const unique: File[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const hash = await generateImageHash(file)

    if (hashes.has(hash)) {
      duplicates.push({ file, duplicateOf: hashes.get(hash)! })
    } else {
      hashes.set(hash, i)
      unique.push(file)
    }
  }

  return { duplicates, unique }
}

/**
 * Create different sizes for responsive images
 */
export async function createResponsiveImages(file: File): Promise<{
  thumbnail: ProcessedImage
  medium: ProcessedImage
  large: ProcessedImage
}> {
  const [thumbnail, medium, large] = await Promise.all([
    compressImage(file, { maxWidth: 300, maxHeight: 300, quality: 0.7 }),
    compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.8 }),
    compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 })
  ])

  return { thumbnail, medium, large }
}

/**
 * Get image dimensions without loading the full image
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(img.src)
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
      URL.revokeObjectURL(img.src)
    }
    
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Create a preview URL for an image file
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * Clean up preview URL
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url)
}

/**
 * Batch process multiple images
 */
export async function batchProcessImages(
  files: File[],
  options: ImageProcessingOptions = {},
  onProgress?: (processed: number, total: number) => void
): Promise<ProcessedImage[]> {
  const results: ProcessedImage[] = []
  
  for (let i = 0; i < files.length; i++) {
    const processed = await compressImage(files[i], options)
    results.push(processed)
    
    if (onProgress) {
      onProgress(i + 1, files.length)
    }
  }
  
  return results
}