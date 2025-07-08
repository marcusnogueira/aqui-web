import { Loader } from '@googlemaps/js-api-loader'

// Singleton pattern for Google Maps loader to avoid multiple API calls
class GoogleMapsLoader {
  private static instance: GoogleMapsLoader
  private loader: Loader
  private loadPromise: Promise<void> | null = null
  private isLoaded = false

  private constructor() {
    this.loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: 'weekly',
      libraries: ['places'],
      // Add performance optimizations
      region: 'US', // Adjust based on your target region
      language: 'en' // Adjust based on your target language
    })
  }

  public static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader()
    }
    return GoogleMapsLoader.instance
  }

  public async load(): Promise<void> {
    if (this.isLoaded) {
      return Promise.resolve()
    }

    if (this.loadPromise) {
      return this.loadPromise
    }

    this.loadPromise = this.loader.load().then(() => {
      this.isLoaded = true
    })

    return this.loadPromise
  }

  public isGoogleMapsLoaded(): boolean {
    return this.isLoaded
  }
}

// Export singleton instance
export const googleMapsLoader = GoogleMapsLoader.getInstance()

// Utility function for components
export const loadGoogleMaps = () => googleMapsLoader.load()
export const isGoogleMapsLoaded = () => googleMapsLoader.isGoogleMapsLoaded()