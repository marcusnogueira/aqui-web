# Maps Documentation

## Overview

This application uses OpenStreetMap (OSM) with MapLibre GL for displaying interactive maps without requiring API keys or usage-based costs. The implementation is designed to be friction-free for automated testing and completely free to use.

## Architecture

### Components

- **OpenStreetMap**: Core map component using MapLibre GL
- **VendorMap**: Wrapper component that converts vendor data to map markers
- **GetDirectionsButton**: Provides navigation functionality
- **AddressInput**: Simple address input with local suggestions (replaces Google Places Autocomplete)

### Key Features

- **Lazy Loading**: Map initializes only when scrolled into view using Intersection Observer
- **Geolocation**: Optional user location detection with smooth recentering
- **Vendor Markers**: Interactive pins with popups showing vendor details
- **Directions**: Support for both OpenStreetMap and Google Maps routing
- **Single Instance**: Map persists across route changes to avoid re-fetching tiles

## Configuration

### Environment Variables

```bash
# Optional: Use Google Maps for directions instead of OpenStreetMap
NEXT_PUBLIC_USE_GOOGLE_DIRECTIONS=true

# Optional: Custom tile server (if you want to use a different provider)
NEXT_PUBLIC_MAP_TILE_URL=https://your-tile-server.com/{z}/{x}/{y}.png
```

### Default Settings

- **Tile Source**: OpenStreetMap public raster tiles
- **Default Center**: San Francisco (37.7749, -122.4194)
- **Default Zoom**: 13
- **User Location Zoom**: 15
- **Attribution**: "© OpenStreetMap contributors"

## Usage

### Basic Map

```tsx
import OpenStreetMap from '@/components/OpenStreetMap'

function MyMap() {
  return (
    <OpenStreetMap
      center={{ lat: 37.7749, lng: -122.4194 }}
      zoom={13}
      enableGeolocation={true}
      showAttribution={true}
      className="w-full h-96"
    />
  )
}
```

### With Markers

```tsx
const markers = [
  {
    id: '1',
    position: { lat: 37.7749, lng: -122.4194 },
    title: 'Vendor Name',
    description: 'Food Vendor',
    isLive: true,
    categoryIcon: '🍕'
  }
]

<OpenStreetMap
  markers={markers}
  onMarkerClick={(id) => console.log('Clicked:', id)}
  enableGeolocation={true}
/>
```

### Get Directions

```tsx
import { getDirections } from '@/lib/directions'

// Open directions to a specific location
await getDirections(
  { lat: 37.7749, lng: -122.4194 },
  {
    useCurrentLocation: true,
    openInNewTab: true
  }
)
```

## Tile Source Guidelines

### OpenStreetMap Usage Policy

- **Courtesy**: OSM tiles are provided free of charge by volunteers
- **Rate Limiting**: Implement reasonable caching and avoid excessive requests
- **Attribution**: Always include "© OpenStreetMap contributors"
- **Commercial Use**: Consider donating to OSM or using a commercial provider for high-traffic applications

### Best Practices

1. **Caching**: Browser automatically caches tiles, but consider implementing service worker caching for offline support
2. **Rate Limiting**: Avoid rapid zoom/pan operations that generate many tile requests
3. **Fallback**: Implement graceful degradation when tiles fail to load
4. **Performance**: Use vector tiles for better performance when possible

### Alternative Providers

If you need to switch to a commercial provider later:

#### MapTiler

```bash
NEXT_PUBLIC_MAP_TILE_URL=https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=YOUR_API_KEY
```

#### Mapbox

```bash
NEXT_PUBLIC_MAP_TILE_URL=https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=YOUR_TOKEN
```

## Testing

### Automated Testing

The map implementation is designed to work seamlessly with Playwright and Puppeteer:

#### Mocking Geolocation

```javascript
// In your test setup
await page.context().grantPermissions(['geolocation'])
await page.setGeolocation({ latitude: 37.7749, longitude: -122.4194 })
```

#### Stubbing Window.open

```javascript
// Prevent actual navigation during tests
await page.addInitScript(() => {
  window.open = (url) => {
    console.log('Would open:', url)
    return null
  }
})
```

#### Testing Directions

```javascript
// Test directions functionality
const { testGeolocation, testWindowOpen } = await import('@/lib/directions')

// Mock geolocation
const mockPosition = { lat: 37.7749, lng: -122.4194 }
const result = await testGeolocation(mockPosition)

// Test URL generation without opening
const url = testWindowOpen('https://example.com')
expect(url).toBe('https://example.com')
```

### Manual Testing

1. **Map Loading**: Scroll to map container and verify it loads
2. **Geolocation**: Grant location permission and verify map recenters
3. **Markers**: Click vendor markers and verify popups appear
4. **Directions**: Click "Get Directions" and verify external map opens
5. **Offline**: Disable network and verify graceful degradation

## Migration from Google Maps

### Removed Dependencies

- `@googlemaps/js-api-loader`
- `@googlemaps/google-maps-services-js`
- `@types/google.maps`

### Breaking Changes

1. **GooglePlacesAutocomplete**: Now provides simple local suggestions instead of Google Places API
2. **API Keys**: No longer required for basic map functionality
3. **Geocoding**: Removed server-side geocoding (can be added back with alternative providers)

### Compatibility

The new implementation maintains the same component interfaces where possible:

- `VendorMap` props remain the same
- `GetDirectionsButton` has the same API
- `AddressInput` (formerly GooglePlacesAutocomplete) maintains similar interface

## Troubleshooting

### Common Issues

1. **Map not loading**: Check browser console for tile loading errors
2. **Geolocation denied**: Ensure HTTPS and handle permission gracefully
3. **Markers not appearing**: Verify marker data has valid coordinates
4. **Directions not working**: Check if popup blocker is preventing new tab

### Performance

- **Slow loading**: Consider using vector tiles or a CDN
- **Memory usage**: Map instance is reused across route changes
- **Mobile performance**: Tiles are optimized for mobile devices

### Browser Support

- **Modern browsers**: Full support for MapLibre GL
- **Older browsers**: Graceful degradation to static map
- **Mobile**: Touch gestures and responsive design

## Contributing

When making changes to the map implementation:

1. Test with geolocation enabled and disabled
2. Verify accessibility with screen readers
3. Test on mobile devices
4. Ensure automated tests pass
5. Update this documentation if adding new features

## Resources

- [OpenStreetMap](https://www.openstreetmap.org/)
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js-docs/)
- [OSM Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)
- [Alternative Tile Providers](https://wiki.openstreetmap.org/wiki/Tile_servers)