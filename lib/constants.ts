// lib/constants.ts

// ===== USER ROLES =====
export const USER_ROLES = {
  ADMIN: 'admin',
  VENDOR: 'vendor',
  CUSTOMER: 'customer',
} as const;
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// ===== VENDOR STATUSES =====
export const VENDOR_STATUSES = {
  APPROVED: 'approved',
  PENDING: 'pending',
  REJECTED: 'rejected',
} as const;
export type VendorStatus = typeof VENDOR_STATUSES[keyof typeof VENDOR_STATUSES];

// Alias for backward compatibility
export const VENDOR_STATUS = VENDOR_STATUSES;

// ===== USER ACCOUNT STATUSES =====
export const USER_STATUSES = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
} as const;
export type UserStatus = typeof USER_STATUSES[keyof typeof USER_STATUSES];

// Alias for backward compatibility
export const USER_ACCOUNT_STATUS = USER_STATUSES;
export type UserAccountStatus = UserStatus;

// ===== FEEDBACK & MODERATION =====
export const FEEDBACK_STATUSES = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
} as const;
export type FeedbackStatus = typeof FEEDBACK_STATUSES[keyof typeof FEEDBACK_STATUSES];

export const FEEDBACK_TYPES = {
  BUG: 'BUG',
  FEATURE: 'FEATURE',
  GENERAL: 'GENERAL',
} as const;
export type FeedbackType = typeof FEEDBACK_TYPES[keyof typeof FEEDBACK_TYPES];

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
export type PriorityLevel = typeof PRIORITY_LEVELS[keyof typeof PRIORITY_LEVELS];

export const MODERATION_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVIEWED: 'reviewed',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
} as const;
export type ModerationStatus = typeof MODERATION_STATUSES[keyof typeof MODERATION_STATUSES];

// Alias for backward compatibility
export const MODERATION_STATUS = MODERATION_STATUSES;

// ===== DATA EXPORT =====
export const EXPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  PDF: 'pdf',
} as const;
export type ExportFormat = typeof EXPORT_FORMATS[keyof typeof EXPORT_FORMATS];

export const EXPORT_TYPES = {
  VENDORS: 'vendors',
  USERS: 'users',
  REVIEWS: 'reviews',
  SALES: 'sales',
} as const;
export type ExportType = typeof EXPORT_TYPES[keyof typeof EXPORT_TYPES];

export const EXPORT_STATUSES = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;
export type ExportStatus = typeof EXPORT_STATUSES[keyof typeof EXPORT_STATUSES];

// ===== BUSINESS CATEGORIES & SUBCATEGORIES =====
export const BUSINESS_CATEGORIES = {
  'Food & Beverage': ['Street Eats', 'Dessert Carts', 'Drink Pop-ups', 'Other'],
  'Vintage & Thrift': ['Second-hand Clothes', 'Sneakers', 'Accessories', 'Other'],
  'Handmade Crafts & Jewelry': ['Artisan Leatherwork', 'Beadwork', 'Metalwork', 'Other'],
  'Books & Zines': ['Indie Publishers', 'Used-book Carts', 'Comics', 'Manga', 'Other'],
  'Art Prints & Stickers': ['Illustrators', 'Postcards', 'Decals', 'Other'],
  'Plants & Flowers': ['Succulent Carts', 'Bouquet Bikes', 'Plant-care Pop-ups', 'Other'],
  'Health & Beauty Services': ['Street Barber', 'Nail-art Booth', 'Mini Spa', 'Other'],
  'Bike & Device Repair': ['Quick Tune-ups', 'Phone-screen Fixes', 'Battery Swaps', 'Other'],
  'Vintage Vinyl & Cassettes': ['Record-crate Sellers', 'DJ Pop-ups', 'Other'],
  'Home & Décor': ['Candles', 'Soaps', 'Pottery', 'Up-cycled Decor', 'Other'],
  'Festival Merch & Apparel': ['Graphic Tees', 'Hats', 'On-site Custom Gear', 'Other'],
  'Other': ['Other'],
} as const;

export type BusinessCategory = keyof typeof BUSINESS_CATEGORIES;
export type BusinessSubcategory = (typeof BUSINESS_CATEGORIES)[BusinessCategory][number];

// ===== PAGINATION =====
export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1,
} as const;
export type PaginationConfig = typeof PAGINATION;

// ===== HTTP STATUS CODES =====
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;
export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];

// ===== ERROR MESSAGES =====
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_CREDENTIALS: 'Invalid credentials',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  INTERNAL_ERROR: 'Internal server error',
  NOT_FOUND: 'Resource not found',
  INVALID_REQUEST: 'Invalid request',
} as const;
export type ErrorMessage = typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES];

// ===== SUCCESS MESSAGES =====
export const SUCCESS_MESSAGES = {
  VENDOR_UPDATED: 'Vendor updated successfully',
  USER_UPDATED: 'User updated successfully',
  ROLE_SWITCHED: 'Role switched successfully',
  VENDOR_CREATED: 'Vendor application submitted successfully',
} as const;
export type SuccessMessage = typeof SUCCESS_MESSAGES[keyof typeof SUCCESS_MESSAGES];

// ===== ADMIN SESSION =====
export const ADMIN_SESSION = {
  COOKIE_NAME: 'admin-session',
  EXPIRES_IN: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  EXPIRATION_TIME: '24h', // JWT expiration time
  MAX_AGE_SECONDS: 24 * 60 * 60, // 24 hours in seconds
} as const;
export type AdminSession = typeof ADMIN_SESSION;

// ===== STATS TIME RANGES =====
export const STATS_TIME_RANGES = {
  LAST_7_DAYS: 7,
  LAST_30_DAYS: 30,
  LAST_90_DAYS: 90,
  LAST_YEAR: 365,
} as const;
export type StatsTimeRange = typeof STATS_TIME_RANGES[keyof typeof STATS_TIME_RANGES];

// ===== UTILITY FUNCTIONS =====
export const getTimeAgoISO = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

// Alias for backward compatibility
export const BUSINESS_TYPES = BUSINESS_CATEGORIES;
