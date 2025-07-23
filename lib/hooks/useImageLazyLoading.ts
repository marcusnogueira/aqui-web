import { useState, useEffect, useRef, useCallback } from 'react'

interface LazyImageOptions {
  rootMargin?: string
  threshold?: number
  placeholder?: string
  fallback?: string
}

interface LazyImageState {
  src: string | null
  loading: boolean
  error: boolean
  loaded: boolean
}

/**
 * Hook for lazy loading images with intersection observer
 */
export function useImageLazyLoading(
  imageSrc: string,
  options: LazyImageOptions = {}
): LazyImageState & { ref: React.RefObject<HTMLImageElement> } {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    placeholder,
    fallback
  } = options

  const [state, setState] = useState<LazyImageState>({
    src: placeholder || null,
    loading: false,
    error: false,
    loaded: false
  })

  const imgRef = useRef<HTMLImageElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const loadImage = useCallback(() => {
    if (state.loaded || state.loading) return

    setState(prev => ({ ...prev, loading: true, error: false }))

    const img = new Image()
    
    img.onload = () => {
      setState({
        src: imageSrc,
        loading: false,
        error: false,
        loaded: true
      })
    }

    img.onerror = () => {
      setState({
        src: fallback || placeholder || null,
        loading: false,
        error: true,
        loaded: false
      })
    }

    img.src = imageSrc
  }, [imageSrc, placeholder, fallback, state.loaded, state.loading])

  useEffect(() => {
    const currentImg = imgRef.current
    if (!currentImg) return

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage()
            observerRef.current?.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin,
        threshold
      }
    )

    observerRef.current.observe(currentImg)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadImage, rootMargin, threshold])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return {
    ...state,
    ref: imgRef
  }
}

/**
 * Hook for progressive image loading with multiple quality levels
 */
export function useProgressiveImage(
  lowQualitySrc: string,
  highQualitySrc: string,
  options: LazyImageOptions = {}
) {
  const [currentSrc, setCurrentSrc] = useState<string>(lowQualitySrc)
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false)
  
  const lazyState = useImageLazyLoading(highQualitySrc, options)

  useEffect(() => {
    if (lazyState.loaded && !lazyState.error) {
      setCurrentSrc(highQualitySrc)
      setIsHighQualityLoaded(true)
    }
  }, [lazyState.loaded, lazyState.error, highQualitySrc])

  return {
    src: currentSrc,
    isHighQualityLoaded,
    loading: lazyState.loading,
    error: lazyState.error,
    ref: lazyState.ref
  }
}

/**
 * Hook for managing multiple lazy-loaded images in a gallery
 */
export function useGalleryLazyLoading(
  images: string[],
  options: LazyImageOptions = {}
) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [errorImages, setErrorImages] = useState<Set<number>>(new Set())
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set())

  const loadImage = useCallback((index: number, src: string) => {
    if (loadedImages.has(index) || loadingImages.has(index)) return

    setLoadingImages(prev => new Set(prev).add(index))
    setErrorImages(prev => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })

    const img = new Image()
    
    img.onload = () => {
      setLoadedImages(prev => new Set(prev).add(index))
      setLoadingImages(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
    }

    img.onerror = () => {
      setErrorImages(prev => new Set(prev).add(index))
      setLoadingImages(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
    }

    img.src = src
  }, [loadedImages, loadingImages])

  const createImageRef = useCallback((index: number, src: string) => {
    const ref = useRef<HTMLImageElement>(null)

    useEffect(() => {
      const currentImg = ref.current
      if (!currentImg) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadImage(index, src)
              observer.unobserve(entry.target)
            }
          })
        },
        {
          rootMargin: options.rootMargin || '50px',
          threshold: options.threshold || 0.1
        }
      )

      observer.observe(currentImg)

      return () => {
        observer.disconnect()
      }
    }, [index, src])

    return ref
  }, [loadImage, options.rootMargin, options.threshold])

  const getImageState = useCallback((index: number) => ({
    loaded: loadedImages.has(index),
    loading: loadingImages.has(index),
    error: errorImages.has(index)
  }), [loadedImages, loadingImages, errorImages])

  return {
    createImageRef,
    getImageState,
    loadedCount: loadedImages.size,
    totalCount: images.length
  }
}