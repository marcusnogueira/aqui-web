# Get Directions Button Implementation

## Overview
This document describes the implementation of the "Get Directions" button feature for vendor profiles in AQUI, as specified in the GitHub issue requirements.

## Requirements Implemented

### ✅ Display Conditions
- **Only displays when vendor is live**: Button only shows when `vendor.live_session.is_active` is `true`
- **Valid live coordinates required**: Button only shows when both `vendor.live_session.latitude` and `vendor.live_session.longitude` are set (not null)

### 🧭 Button Configuration
- **Label**: "Get Directions" (localized via i18n)
- **Icon**: MapPin icon from Lucide React
- **Variant**: Uses `variant="outline"` styling
- **Link behavior**: Opens in new tab using `target="_blank"`

### 🌐 Google Maps Integration
- **URL Format**: Uses `https://www.google.com/maps/dir/?api=1&destination=<live_lat>,<live_lng>`
- **Provider**: Configured to use Google Maps via `NEXT_PUBLIC_USE_GOOGLE_DIRECTIONS=true`
- **Walking directions**: Google Maps defaults to walking directions for the format used

### 📱 Responsive Design
- **Mobile**: Full width (`w-full`)
- **Desktop**: Auto width (`sm:w-auto`)
- **Layout**: Flexbox with proper spacing and alignment

### 🌍 Internationalization
- **Translation key**: `t('get_directions')`
- **Supported languages**: English, Spanish, Tagalog, Vietnamese, Chinese
- **Namespace**: Uses 'common' namespace for global availability

## Files Modified

### 1. Translation Files
Added `get_directions` key to all language files:
- `public/locales/en/common.json`: "Get Directions"
- `public/locales/es/common.json`: "Obtener Direcciones"  
- `public/locales/tl/common.json`: "Kumuha ng Direksyon"
- `public/locales/vi/common.json`: "Lấy Chỉ Đường"
- `public/locales/zh/common.json`: "获取路线"

### 2. GetDirectionsButton Component (`components/GetDirectionsButton.tsx`)
**Changes made:**
- Added `useTranslation` hook for i18n support
- Changed default icon from Navigation to MapPin
- Updated button text to use `t('get_directions')`
- Added responsive classes: `w-full sm:w-auto`
- Updated title attribute to use translated text

### 3. Vendor Profile Page (`app/vendor/[id]/page.tsx`)
**Changes made:**
- Added `useTranslation` import and hook
- Renamed `coordinates` to `liveCoordinates` for clarity
- Updated coordinate extraction logic to only use live session coordinates
- Added condition to only show button when vendor is live with coordinates
- Updated layout to be responsive with proper flex direction
- Removed custom styling in favor of component defaults

### 4. Environment Configuration
**Added to `.env.local` and `.env.example`:**
```bash
NEXT_PUBLIC_USE_GOOGLE_DIRECTIONS=true
```

## Implementation Logic

### Coordinate Extraction
```typescript
const liveCoordinates = useMemo(() => {
  if (!vendor) return null;
  
  // Only show directions if vendor is live with active session and has live coordinates
  if (vendor.live_session && 
      vendor.live_session.is_active && 
      vendor.live_session.latitude && 
      vendor.live_session.longitude) {
    return { 
      lat: vendor.live_session.latitude, 
      lng: vendor.live_session.longitude 
    };
  }
  
  return null;
}, [vendor]);
```

### Button Rendering
```tsx
{liveCoordinates && (
  <GetDirectionsButton
    destination={liveCoordinates}
    vendorName={vendor.business_name}
    variant="outline"
  />
)}
```

## Database Schema Reference

The implementation relies on the `vendor_live_sessions` table:
```sql
vendor_live_sessions {
  is_active: boolean | null
  latitude: number | null  
  longitude: number | null
  -- other fields...
}
```

## Testing

A test script has been created at `scripts/test-directions-button.js` to verify:
- Google Maps configuration
- URL generation format
- Coordinate validation
- Live session requirements
- Button display logic

## Usage Examples

### Live Vendor (Button Shows)
```javascript
const liveVendor = {
  live_session: {
    is_active: true,
    latitude: 37.7749,
    longitude: -122.4194
  }
};
// Button will be displayed
```

### Offline Vendor (Button Hidden)
```javascript
const offlineVendor = {
  live_session: {
    is_active: false,
    latitude: 37.7749,
    longitude: -122.4194
  }
};
// Button will NOT be displayed
```

### Live Vendor Without Coordinates (Button Hidden)
```javascript
const noCoordinatesVendor = {
  live_session: {
    is_active: true,
    latitude: null,
    longitude: null
  }
};
// Button will NOT be displayed
```

## Security Considerations

- Uses `target="_blank"` with `rel="noopener,noreferrer"` for security
- Validates coordinates before generating URLs
- No sensitive data exposed in direction URLs
- Uses environment variables for configuration

## Performance Considerations

- Coordinates are memoized using `useMemo` to prevent unnecessary recalculations
- Button only renders when conditions are met
- Lazy loading of direction provider configuration

## Future Enhancements

Potential improvements that could be added:
- Distance calculation and display
- Estimated travel time
- Alternative transportation modes
- Offline map support
- Custom map integration

## Conclusion

The Get Directions button has been successfully implemented according to all specified requirements. The feature is fully functional, responsive, internationalized, and follows best practices for security and performance.