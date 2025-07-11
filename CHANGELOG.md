# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- OpenStreetMap integration using MapLibre GL for key-free mapping
- Get Directions functionality with support for OpenStreetMap and Google Maps
- Lazy loading map component with Intersection Observer
- Geolocation support with smooth recentering to user location
- Interactive vendor markers with popups and status indicators
- Simple address input component with local suggestions
- Comprehensive maps documentation in `docs/maps.md`
- Environment variable support for direction provider selection
- Automated testing compatibility with Playwright/Puppeteer

### Changed
- Replaced Google Maps API with OpenStreetMap for cost-free operation
- Updated VendorMap component to use new OpenStreetMap implementation
- Converted GooglePlacesAutocomplete to simple AddressInput component
- Map now persists across route changes to avoid re-fetching tiles
- Default map center set to San Francisco with zoom level 13
- User location recentering now uses zoom level 15

### Removed
- Google Maps API dependencies (`@googlemaps/js-api-loader`, `@googlemaps/google-maps-services-js`)
- Google Maps TypeScript types (`@types/google.maps`)
- Google Maps API key requirement (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
- Google Maps loader utility (`lib/google-maps-loader.ts`)
- Usage-based costs and API rate limiting concerns
- External API dependencies for basic map functionality

### Technical Details
- **Breaking Change**: Applications using Google Places Autocomplete will now receive local suggestions instead of Google Places API results
- **Environment**: No API keys required for default functionality
- **Performance**: Single map instance reduces tile re-fetching
- **Testing**: Geolocation and window.open can be mocked for automated tests
- **Attribution**: Proper OpenStreetMap contributor attribution included

### Migration Guide
- Remove `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` from environment variables
- Update any custom implementations that relied on Google Maps API
- Test geolocation functionality in your specific use case
- Verify that address input suggestions meet your requirements
- Consider implementing custom geocoding if precise address validation is needed

---

## Previous Versions

*This changelog was started with the OpenStreetMap migration. Previous changes were not documented in this format.*