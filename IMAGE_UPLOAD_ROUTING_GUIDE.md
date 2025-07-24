# Image Upload Routing Guide

## Fixed Issues ✅

1. **Fixed generic upload route**: `/api/vendor/upload-image` now properly handles all image types
2. **Correct database columns**: Routes now update the correct columns based on image type
3. **Proper file organization**: Images are stored in appropriate folders

## Database Schema (Confirmed Correct) ✅

```sql
CREATE TABLE vendors (
  profile_image_url TEXT,                -- Single profile image URL
  banner_image_url TEXT[],              -- Array of banner image URLs  
  gallery_images TEXT[],                -- Array of gallery image URLs
  -- ... other columns
);
```

## Upload Routes Usage

### 1. Profile Image Upload
**Route**: `POST /api/vendor/upload-image`
**FormData**:
```javascript
const formData = new FormData()
formData.append('files', profileImageFile)
formData.append('vendorId', vendorId) 
formData.append('imageType', 'profile')  // ← KEY PARAMETER
```
**Updates**: `profile_image_url` (single string)
**File limit**: 1 file only
**Storage path**: `vendor-images/{vendorId}/profile.{ext}`

### 2. Banner Image Upload  
**Route**: `POST /api/vendor/upload-image`
**FormData**:
```javascript
const formData = new FormData()
files.forEach(file => formData.append('files', file))
formData.append('vendorId', vendorId)
formData.append('imageType', 'banner')  // ← KEY PARAMETER
```
**Updates**: `banner_image_url` (array - appends new URLs)
**File limit**: Multiple files allowed
**Storage path**: `vendor-images/{vendorId}/banner/{timestamp}-{random}.{ext}`

### 3. Gallery Image Upload
**Route**: `POST /api/vendor/upload-image`
**FormData**:
```javascript  
const formData = new FormData()
files.forEach(file => formData.append('files', file))
formData.append('vendorId', vendorId)
formData.append('imageType', 'gallery')  // ← KEY PARAMETER
```
**Updates**: `gallery_images` (array - appends new URLs)
**File limit**: Multiple files allowed (max 10 via existing gallery route)
**Storage path**: `vendor-images/{vendorId}/gallery/{timestamp}-{random}.{ext}`

## Alternative Routes (Still Available)

### Profile + Banner via Update Profile
**Route**: `POST /api/vendor/update-profile`
- Handles profile and banner images along with other profile data
- Still works correctly ✅

### Gallery via Dedicated Route  
**Route**: `POST /api/vendors/gallery/upload`
- Dedicated gallery upload with advanced features
- Still works correctly ✅

## Frontend Integration

### Example: Profile Image Upload
```javascript
const uploadProfileImage = async (file, vendorId) => {
  const formData = new FormData()
  formData.append('files', file)
  formData.append('vendorId', vendorId)
  formData.append('imageType', 'profile')  // ← REQUIRED
  
  const response = await fetch('/api/vendor/upload-image', {
    method: 'POST',
    body: formData
  })
  
  return response.json()
}
```

### Example: Banner Images Upload
```javascript
const uploadBannerImages = async (files, vendorId) => {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))
  formData.append('vendorId', vendorId)
  formData.append('imageType', 'banner')  // ← REQUIRED
  
  const response = await fetch('/api/vendor/upload-image', {
    method: 'POST',
    body: formData
  })
  
  return response.json()
}
```

### Example: Gallery Images Upload
```javascript
const uploadGalleryImages = async (files, vendorId) => {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))
  formData.append('vendorId', vendorId)
  formData.append('imageType', 'gallery')  // ← REQUIRED
  
  const response = await fetch('/api/vendor/upload-image', {
    method: 'POST', 
    body: formData
  })
  
  return response.json()
}
```

## Important Notes

1. **imageType parameter is required** - The route will return an error without it
2. **Profile images limit to 1 file** - Multiple files will be rejected
3. **File size limit**: 5MB per file
4. **Storage organization**: Files are organized in folders by type for better management
5. **Database consistency**: Each image type updates the correct column in the vendors table

## Testing the Fix

To test that uploads are working correctly:

1. **Profile Image**: Check that `vendors.profile_image_url` is updated with a single URL
2. **Banner Images**: Check that `vendors.banner_image_url` array contains the new URLs
3. **Gallery Images**: Check that `vendors.gallery_images` array contains the new URLs

The fix ensures that all three image types route to the correct database columns based on the provided `imageType` parameter.