# Standardized Error Handling System

This document describes the standardized error handling system implemented across all `lib/` utilities in the Aqui application.

## Overview

The error handling system provides:
- **Consistent error types and severity levels**
- **Standardized error wrapping and logging**
- **Result types for safe error propagation**
- **Centralized error management**

## Core Components

### 1. Error Types (`ErrorType`)
- `VALIDATION` - Input validation errors
- `AUTHENTICATION` - Auth-related errors
- `AUTHORIZATION` - Permission errors
- `NETWORK` - Network/API errors
- `DATABASE` - Database operation errors
- `GEOLOCATION` - Location service errors
- `BUSINESS_LOGIC` - Application logic errors
- `SYSTEM` - System-level errors
- `UNKNOWN` - Unclassified errors

### 2. Error Severity (`ErrorSeverity`)
- `LOW` - Minor issues, warnings
- `MEDIUM` - Recoverable errors
- `HIGH` - Critical errors requiring attention
- `CRITICAL` - System-breaking errors

### 3. Result Type
```typescript
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: StandardError }
```

## Usage Examples

### Basic Error Wrapping
```typescript
// Async function
export const fetchData = async (): Promise<Result<Data>> => {
  return errorHandler.wrapAsync(async () => {
    const response = await api.getData()
    if (!response.ok) {
      throw createNetworkError('Failed to fetch data', 'FETCH_FAILED')
    }
    return response.data
  }, 'fetchData')
}

// Sync function
export const processData = (data: unknown): ProcessedData => {
  return errorHandler.wrapSync(() => {
    if (!data) {
      throw createValidationError('Data is required', 'DATA_REQUIRED')
    }
    return transform(data)
  }, 'processData', defaultValue)
}
```

### Error Creation Helpers
```typescript
// Authentication errors
throw createAuthError('Login failed', 'LOGIN_FAILED', originalError)

// Validation errors
throw createValidationError('Invalid email format', 'INVALID_EMAIL')

// Network errors
throw createNetworkError('API unavailable', 'API_DOWN', networkError)

// Database errors
throw createDatabaseError('Query failed', 'QUERY_FAILED', dbError)

// Geolocation errors
throw createGeolocationError('Location denied', 'PERMISSION_DENIED')
```

### Handling Results
```typescript
// Consumer code
const result = await fetchUserData(userId)
if (result.success) {
  console.log('User data:', result.data)
} else {
  console.error('Error:', result.error.message)
  // Handle specific error types
  if (result.error.type === ErrorType.AUTHENTICATION) {
    redirectToLogin()
  }
}
```

## Updated Files

The following files have been updated to use the standardized error handling:

### Core Error Handler
- `lib/error-handler.ts` - Main error handling system

### Authentication & Authorization
- `lib/auth-helpers.ts` - Client-side auth functions
- `lib/supabase-client.ts` - Supabase client auth
- `lib/supabase-server.ts` - Server-side auth
- `lib/admin-auth.ts` - Admin authentication

### Data & Business Logic
- `lib/business-types.ts` - Business type utilities
- `lib/directions.ts` - Geolocation and directions

### System Utilities
- `lib/performance-utils.ts` - Performance monitoring

### UI Components
- `app/admin/dashboard/page.tsx` - Admin dashboard
- `components/AdminLayout.tsx` - Admin layout

## Benefits

1. **Consistency** - All errors follow the same structure
2. **Type Safety** - TypeScript ensures proper error handling
3. **Debugging** - Centralized logging with context
4. **Maintainability** - Easy to update error handling logic
5. **User Experience** - Better error messages and recovery
6. **Monitoring** - Structured error data for analytics

## Best Practices

1. **Always use Result types** for functions that can fail
2. **Wrap external API calls** with appropriate error handlers
3. **Use specific error types** rather than generic ones
4. **Include context** in error messages
5. **Log errors appropriately** based on severity
6. **Provide fallback values** for non-critical operations
7. **Handle errors at component boundaries** in React

## Migration Notes

When updating existing code:
1. Replace `try-catch` blocks with `errorHandler.wrapAsync/wrapSync`
2. Change return types to `Result<T>` for fallible operations
3. Use error creation helpers instead of `new Error()`
4. Update consumers to handle `Result` types
5. Test error scenarios thoroughly