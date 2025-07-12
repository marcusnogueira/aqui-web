import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import { errorHandler, createDatabaseError, ErrorSeverity, Result, createResult } from '@/lib/error-handler'

type BusinessType = Database['public']['Tables']['business_types']['Row']
type BusinessSubcategory = Database['public']['Tables']['business_subcategories']['Row']

export interface BusinessTypesData {
  [key: string]: string[];
}

// Cache for business types data to avoid repeated database calls
let businessTypesCache: BusinessTypesData | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch business types and subcategories from database
 */
export const fetchBusinessTypesFromDB = async (): Promise<Result<BusinessTypesData>> => {
  try {
    const supabase = createClient()
    
    // Fetch business types
    const { data: businessTypes, error: businessTypesError } = await supabase
      .from('business_types')
      .select('*')
    
    if (businessTypesError) {
      const error = createDatabaseError(
        `Failed to fetch business types: ${businessTypesError.message}`,
        'BUSINESS_TYPES_FETCH_FAILED',
        businessTypesError
      )
      return createResult.error(error)
    }
    
    // Fetch business subcategories
    const { data: subcategories, error: subcategoriesError } = await supabase
      .from('business_subcategories')
      .select('*')
    
    if (subcategoriesError) {
      const error = createDatabaseError(
        `Failed to fetch business subcategories: ${subcategoriesError.message}`,
        'BUSINESS_SUBCATEGORIES_FETCH_FAILED',
        subcategoriesError
      )
      return createResult.error(error)
    }
    
    // Group subcategories by business type
    const result: BusinessTypesData = {}
    
    // Initialize all business types
    businessTypes?.forEach(businessType => {
      if (businessType.name) {
        result[businessType.name] = []
      }
    })
    
    // Add subcategories to their respective business types
    subcategories?.forEach(subcategory => {
      if (subcategory.business_type_id && subcategory.name) {
        const businessType = businessTypes?.find(bt => bt.id === subcategory.business_type_id)
        if (businessType?.name && result[businessType.name]) {
          result[businessType.name].push(subcategory.name)
        }
      }
    })
    
    // Sort subcategories for each business type
    Object.keys(result).forEach(businessType => {
      result[businessType].sort()
    })
    
    return createResult.success(result)
  } catch (error) {
    const standardError = errorHandler.handle(error as Error, 'fetchBusinessTypesFromDB')
    return createResult.error(standardError)
  }
}

/**
 * Get business types data with caching
 */
export const getBusinessTypes = async (): Promise<BusinessTypesData> => {
  return errorHandler.wrapAsync(async () => {
    const now = Date.now()
    
    // Return cached data if still valid
    if (businessTypesCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return businessTypesCache
    }
    
    // Fetch fresh data
    const result = await fetchBusinessTypesFromDB()
    if (!result.success) {
      throw result.error
    }
    
    businessTypesCache = result.data
    cacheTimestamp = now
    
    return businessTypesCache
  }, 'getBusinessTypes', {}) as Promise<BusinessTypesData>
}

/**
 * Get all business type names
 */
export const getBusinessTypeKeys = async (): Promise<string[]> => {
  return errorHandler.wrapAsync(async () => {
    const businessTypes = await getBusinessTypes()
    return Object.keys(businessTypes)
  }, 'getBusinessTypeKeys', []) as Promise<string[]>
}

/**
 * Get subcategories for a specific business type
 */
export const getSubcategoriesForBusinessType = async (businessType: string): Promise<string[]> => {
  return errorHandler.wrapAsync(async () => {
    const businessTypes = await getBusinessTypes()
    return businessTypes[businessType] || []
  }, 'getSubcategoriesForBusinessType', []) as Promise<string[]>
}

/**
 * Get all subcategories across all business types
 */
export const getAllSubcategories = async (): Promise<string[]> => {
  return errorHandler.wrapAsync(async () => {
    const businessTypes = await getBusinessTypes()
    return Object.values(businessTypes).flat()
  }, 'getAllSubcategories', []) as Promise<string[]>
}

/**
 * Search subcategories with optional business type filter
 */
export const searchSubcategories = async (query: string, businessType?: string): Promise<string[]> => {
  return errorHandler.wrapAsync(async () => {
    const subcategories = businessType 
      ? await getSubcategoriesForBusinessType(businessType)
      : await getAllSubcategories()
    
    if (!query) return subcategories
    
    return subcategories.filter(subcategory => 
      subcategory.toLowerCase().includes(query.toLowerCase())
    )
  }, 'searchSubcategories', []) as Promise<string[]>
}

/**
 * Clear the cache (useful for testing or when data is updated)
 */
export const clearBusinessTypesCache = (): void => {
  businessTypesCache = null
  cacheTimestamp = 0
}