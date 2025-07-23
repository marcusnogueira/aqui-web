'use client'

import { useState, useRef, useCallback } from 'react'

interface ImageUploaderProps {
  onUpload: (files: File[]) => Promise<void>
  maxImages: number
  currentImageCount: number
  existingImages?: string[] // URLs of existing images for duplicate detection
  disabled?: boolean
  className?: string
}

interface FileWithPreview extends File {
  preview?: string
}

const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function ImageUploader({ 
  onUpload, 
  maxImages, 
  currentImageCount, 
  existingImages = [],
  disabled = false,
  className = '' 
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return `${file.name}: Only JPEG, PNG, and WebP files are allowed`
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File size must be less than 5MB`
    }
    
    return null
  }

  // Generate a simple hash for file content comparison
  const generateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Check if file is similar to existing images (basic duplicate detection)
  const checkForDuplicates = async (files: File[]): Promise<string[]> => {
    const duplicateErrors: string[] = []
    
    try {
      // Generate hashes for new files
      const fileHashes = await Promise.all(
        files.map(async (file) => ({
          file,
          hash: await generateFileHash(file),
          size: file.size,
          name: file.name
        }))
      )
      
      // Check for duplicates within the new files
      const hashMap = new Map<string, string[]>()
      fileHashes.forEach(({ file, hash }) => {
        if (!hashMap.has(hash)) {
          hashMap.set(hash, [])
        }
        hashMap.get(hash)!.push(file.name)
      })
      
      hashMap.forEach((names, hash) => {
        if (names.length > 1) {
          duplicateErrors.push(`Duplicate files detected: ${names.join(', ')}`)
        }
      })
      
      // Check for files with identical names (simpler check)
      const fileNames = files.map(f => f.name)
      const nameDuplicates = fileNames.filter((name, index) => fileNames.indexOf(name) !== index)
      if (nameDuplicates.length > 0) {
        const uniqueDuplicates = [...new Set(nameDuplicates)]
        duplicateErrors.push(`Files with identical names: ${uniqueDuplicates.join(', ')}`)
      }
      
    } catch (error) {
      console.warn('Error checking for duplicates:', error)
      // Fall back to name-based duplicate detection
      const fileNames = files.map(f => f.name)
      const duplicates = fileNames.filter((name, index) => fileNames.indexOf(name) !== index)
      if (duplicates.length > 0) {
        duplicateErrors.push(`Duplicate files detected: ${[...new Set(duplicates)].join(', ')}`)
      }
    }
    
    return duplicateErrors
  }

  const validateFiles = async (files: File[]): Promise<string[]> => {
    const errors: string[] = []
    
    // Check if adding these files would exceed the limit
    if (currentImageCount + files.length > maxImages) {
      errors.push(`Cannot upload ${files.length} files. Maximum ${maxImages} images allowed (currently have ${currentImageCount})`)
      return errors
    }
    
    // Validate each file
    files.forEach(file => {
      const error = validateFile(file)
      if (error) errors.push(error)
    })
    
    // Check for duplicates
    const duplicateErrors = await checkForDuplicates(files)
    errors.push(...duplicateErrors)
    
    // Additional validation: Check total file size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    const maxTotalSize = 50 * 1024 * 1024 // 50MB total
    if (totalSize > maxTotalSize) {
      errors.push(`Total file size (${(totalSize / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed (50MB)`)
    }
    
    // Check for very similar file sizes (potential duplicates)
    const fileSizes = files.map(f => f.size)
    const sizeDuplicates = fileSizes.filter((size, index) => {
      return fileSizes.findIndex(s => Math.abs(s - size) < 1000) !== index // Within 1KB
    })
    if (sizeDuplicates.length > 0) {
      errors.push('Warning: Some files have very similar sizes and may be duplicates')
    }
    
    return errors
  }

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    // Show loading state while validating
    setValidationErrors(['Validating files...'])
    
    const errors = await validateFiles(fileArray)
    
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }
    
    setValidationErrors([])
    
    // Create preview URLs for selected files
    const filesWithPreview: FileWithPreview[] = fileArray.map(file => {
      const fileWithPreview = file as FileWithPreview
      fileWithPreview.preview = URL.createObjectURL(file)
      return fileWithPreview
    })
    
    setSelectedFiles(filesWithPreview)
  }, [currentImageCount, maxImages, existingImages])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      await processFiles(files)
    }
  }, [disabled, processFiles])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await processFiles(files)
    }
  }, [processFiles])

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return
    
    setIsUploading(true)
    try {
      await onUpload(selectedFiles)
      
      // Clean up preview URLs
      selectedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
      
      setSelectedFiles([])
      setValidationErrors([])
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload error:', error)
      setValidationErrors(['Upload failed. Please try again.'])
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    // Clean up preview URLs
    selectedFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })
    
    setSelectedFiles([])
    setValidationErrors([])
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const remainingSlots = maxImages - currentImageCount

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-colors
          ${isDragOver && !disabled ? 'border-[#3A938A] bg-teal-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#3A938A] hover:bg-gray-50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="space-y-2">
          <div className="w-12 h-12 mx-auto text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-gray-600 font-medium">
              {disabled ? 'Upload disabled' : 'Drop images here or click to browse'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              JPEG, PNG, WebP up to 5MB each
            </p>
            <p className="text-sm text-gray-500">
              {remainingSlots} of {maxImages} slots available
            </p>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className={`border rounded-lg p-4 ${
          validationErrors[0] === 'Validating files...' 
            ? 'bg-blue-50 border-blue-200' 
            : validationErrors.some(e => e.startsWith('Warning:'))
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start">
            {validationErrors[0] === 'Validating files...' ? (
              <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : validationErrors.some(e => e.startsWith('Warning:')) ? (
              <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <div>
              <h4 className={`text-sm font-medium mb-1 ${
                validationErrors[0] === 'Validating files...' 
                  ? 'text-blue-800' 
                  : validationErrors.some(e => e.startsWith('Warning:'))
                    ? 'text-yellow-800'
                    : 'text-red-800'
              }`}>
                {validationErrors[0] === 'Validating files...' 
                  ? 'Validating Files' 
                  : validationErrors.some(e => e.startsWith('Warning:'))
                    ? 'Upload Warnings'
                    : 'Upload Errors'
                }
              </h4>
              <ul className={`text-sm space-y-1 ${
                validationErrors[0] === 'Validating files...' 
                  ? 'text-blue-700' 
                  : validationErrors.some(e => e.startsWith('Warning:'))
                    ? 'text-yellow-700'
                    : 'text-red-700'
              }`}>
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Selected Files ({selectedFiles.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {file.preview && (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-600 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Upload Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading || selectedFiles.length === 0}
              className="px-6 py-2 text-sm font-medium text-white bg-[#3A938A] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image${selectedFiles.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}