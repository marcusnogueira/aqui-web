import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

const MAX_IMAGES = 10
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface GalleryUploadResponse {
  success: boolean
  imageUrls?: string[]
  error?: string
  details?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<GalleryUploadResponse>> {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get Supabase client
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)

    // Get vendor for this user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, gallery_images, gallery_titles')
      .eq('user_id', session.user.id)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll('images') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images provided' },
        { status: 400 }
      )
    }

    // Check if adding these images would exceed the limit
    const currentImageCount = vendor.gallery_images?.length || 0
    if (currentImageCount + files.length > MAX_IMAGES) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot upload ${files.length} images. Maximum ${MAX_IMAGES} images allowed. You currently have ${currentImageCount} images.` 
        },
        { status: 400 }
      )
    }

    // Validate files
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_TYPES.join(', ')}` 
          },
          { status: 400 }
        )
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { 
            success: false, 
            error: `File ${file.name} is too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
          },
          { status: 400 }
        )
      }
    }

    // Upload images to Supabase storage
    const uploadedUrls: string[] = []
    const uploadPromises = files.map(async (file, index) => {
      try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${vendor.id}/gallery/${uuidv4()}.${fileExt}`

        // Convert File to ArrayBuffer for upload
        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('vendor-images')
          .upload(fileName, uint8Array, { 
            upsert: false,
            contentType: file.type
          })

        if (uploadError) {
          console.error(`Upload error for file ${file.name}:`, uploadError)
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`)
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('vendor-images')
          .getPublicUrl(fileName)

        return publicUrl
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
        throw error
      }
    })

    try {
      const urls = await Promise.all(uploadPromises)
      uploadedUrls.push(...urls)
    } catch (error) {
      // If any upload fails, clean up successful uploads
      for (const url of uploadedUrls) {
        try {
          const fileName = url.split('/').pop()
          if (fileName) {
            await supabase.storage
              .from('vendor-images')
              .remove([`${vendor.id}/gallery/${fileName}`])
          }
        } catch (cleanupError) {
          console.error('Error cleaning up uploaded file:', cleanupError)
        }
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to upload images',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

    // Update vendor gallery_images in database
    const updatedGalleryImages = [...(vendor.gallery_images || []), ...uploadedUrls]
    const updatedGalleryTitles = [...(vendor.gallery_titles || []), ...new Array(uploadedUrls.length).fill('')]

    const { error: updateError } = await supabase
      .from('vendors')
      .update({
        gallery_images: updatedGalleryImages,
        gallery_titles: updatedGalleryTitles,
        updated_at: new Date().toISOString()
      })
      .eq('id', vendor.id)

    if (updateError) {
      // Clean up uploaded files if database update fails
      for (const url of uploadedUrls) {
        try {
          const fileName = url.split('/').pop()
          if (fileName) {
            await supabase.storage
              .from('vendor-images')
              .remove([`${vendor.id}/gallery/${fileName}`])
          }
        } catch (cleanupError) {
          console.error('Error cleaning up uploaded file:', cleanupError)
        }
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update gallery',
          details: updateError.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imageUrls: uploadedUrls
    })

  } catch (error) {
    console.error('Gallery upload API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}