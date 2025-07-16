/**
 * Category configuration for vendor icons and styling
 * Centralizes category-related logic for better maintainability
 */

export interface CategoryConfig {
  icon: string
  color: string
  label: string
  keywords: string[]
}

// Category configuration mapping
export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  food: {
    icon: '🍽️',
    color: '#FF6B6B',
    label: 'Food',
    keywords: ['food', 'meal', 'restaurant', 'kitchen', 'dining']
  },
  coffee: {
    icon: '☕',
    color: '#8B4513',
    label: 'Coffee',
    keywords: ['coffee', 'cafe', 'espresso', 'latte', 'cappuccino', 'brew']
  },
  dessert: {
    icon: '🍰',
    color: '#FFB6C1',
    label: 'Dessert',
    keywords: ['dessert', 'cake', 'sweet', 'pastry', 'ice cream', 'bakery']
  },
  drinks: {
    icon: '🥤',
    color: '#4ECDC4',
    label: 'Drinks',
    keywords: ['drink', 'beverage', 'juice', 'smoothie', 'tea', 'soda']
  },
  snacks: {
    icon: '🍿',
    color: '#FFE66D',
    label: 'Snacks',
    keywords: ['snack', 'chips', 'nuts', 'popcorn', 'crackers']
  },
  healthy: {
    icon: '🥗',
    color: '#4ECDC4',
    label: 'Healthy',
    keywords: ['healthy', 'salad', 'organic', 'vegan', 'vegetarian', 'fresh']
  },
  default: {
    icon: '🛒',
    color: '#95A5A6',
    label: 'General',
    keywords: []
  }
}

/**
 * Get category configuration based on subcategory string
 * Uses keyword matching for flexible categorization
 */
export function getCategoryConfig(subcategory?: string | null): CategoryConfig {
  if (!subcategory) {
    return CATEGORY_CONFIG.default
  }
  
  const normalizedSubcategory = subcategory.toLowerCase().trim()
  
  // Find matching category by keywords
  for (const [categoryKey, config] of Object.entries(CATEGORY_CONFIG)) {
    if (categoryKey === 'default') continue
    
    const hasMatch = config.keywords.some(keyword => 
      normalizedSubcategory.includes(keyword)
    )
    
    if (hasMatch) {
      return config
    }
  }
  
  // Return default if no match found
  return CATEGORY_CONFIG.default
}

/**
 * Get category icon (shorthand for getCategoryConfig().icon)
 */
export function getCategoryIcon(subcategory?: string | null): string {
  return getCategoryConfig(subcategory).icon
}

/**
 * Get category color (shorthand for getCategoryConfig().color)
 */
export function getCategoryColor(subcategory?: string | null): string {
  return getCategoryConfig(subcategory).color
}

/**
 * Get all available categories for UI components
 */
export function getAllCategories(): CategoryConfig[] {
  return Object.values(CATEGORY_CONFIG).filter(config => config !== CATEGORY_CONFIG.default)
}

/**
 * Check if a subcategory matches a specific category
 */
export function matchesCategory(subcategory: string | null, categoryKey: string): boolean {
  if (!subcategory || !CATEGORY_CONFIG[categoryKey]) {
    return false
  }
  
  const config = CATEGORY_CONFIG[categoryKey]
  const normalizedSubcategory = subcategory.toLowerCase().trim()
  
  return config.keywords.some(keyword => 
    normalizedSubcategory.includes(keyword)
  )
}