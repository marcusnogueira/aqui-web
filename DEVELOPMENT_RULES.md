# Development Rules & Standards

This document outlines structural requirements and best practices that should be consistently implemented across the codebase.

## Next.js Component Rules

### Client Components
**Rule**: Any component that uses React hooks (`useState`, `useEffect`, etc.) or browser APIs must be marked as a Client Component.

**Implementation**: Add `'use client';` as the very first line of the file.

**Examples of when to use**:
- Components using `useState`, `useEffect`, `useContext`
- Components handling user interactions (forms, buttons with onClick)
- Components accessing browser APIs (localStorage, geolocation, etc.)
- Components using third-party libraries that require client-side rendering

**Example**:
```typescript
'use client';
import { useState, useEffect } from 'react';

export default function MyComponent() {
  const [state, setState] = useState('');
  // ... component logic
}
```

### Server Components (Default)
**Rule**: Keep components as Server Components when possible for better performance.

**Use for**:
- Static content rendering
- Data fetching with server-side APIs
- SEO-critical pages
- Components that don't require interactivity

## TypeScript & Import Rules

### Constants Import
**Rule**: Always import constants from `@/lib/constants` using the exported constant names.

**Examples**:
- ✅ `import { USER_ROLES, BUSINESS_CATEGORIES } from '@/lib/constants'`
- ❌ `import { BUSINESS_TYPES } from '@/lib/constants'` (use BUSINESS_CATEGORIES)

### Type Safety
**Rule**: Handle null/undefined values explicitly, especially for optional database fields.

**Example**:
```typescript
// ✅ Safe handling
const avgRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length;

// ❌ Unsafe - could throw if rating is null
const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
```

## File Structure Rules

### API Routes
**Rule**: API routes should include proper error handling and status codes from `HTTP_STATUS` constants.

### Component Organization
**Rule**: 
- Keep components focused on single responsibilities
- Extract reusable logic into custom hooks or utilities
- Use proper TypeScript interfaces for props and data structures

## Build & Quality Checks

### Pre-deployment Checklist
1. Run `npm run build` to ensure no TypeScript errors
2. Verify all imports are correctly resolved
3. Check that client components are properly marked with `'use client'`
4. Ensure proper error handling in API routes
5. Validate type safety for database operations

## Common Patterns to Follow

### Error Handling
```typescript
try {
  // operation
} catch (error) {
  console.error('Descriptive error message:', error);
  toast.error(ERROR_MESSAGES.GENERIC);
}
```

### Role-based Access
```typescript
// Use constants for role comparisons
if (currentRole === USER_ROLES.ADMIN) {
  // admin logic
}
```

### Database Operations
```typescript
// Always handle potential null values
const user = await getUserById(id);
if (!user) {
  return { error: ERROR_MESSAGES.USER_NOT_FOUND };
}
```

## Critical Development Principles

### No Band-Aid Solutions
**RULE**: Never implement temporary fixes, delays, or workarounds to mask underlying issues.

**Examples of BANNED approaches**:
- ❌ Adding `setTimeout()` to "fix" timing issues
- ❌ Using hardcoded delays to prevent race conditions  
- ❌ Adding `debounce()` without understanding why multiple calls happen
- ❌ Disabling functionality instead of fixing the root cause
- ❌ Using `try/catch` to suppress errors without addressing them

**Required approach**:
- ✅ Identify and fix the root cause of the problem
- ✅ Understand WHY something is happening before fixing it
- ✅ Trace through the complete execution flow
- ✅ Fix architectural issues, not symptoms

### No Hardcoded Values
**RULE**: Never use magic numbers or hardcoded values without clear justification.

**Examples of BANNED approaches**:
- ❌ `setTimeout(callback, 1000)` - why 1000ms?
- ❌ `if (items.length > 5)` - why 5?
- ❌ `lat.toFixed(2)` - why 2 decimal places?

**Required approach**:
- ✅ Use named constants: `DEBOUNCE_DELAY_MS = 300`
- ✅ Document the reasoning in comments
- ✅ Make values configurable when appropriate

---

**Note**: This document should be updated whenever new structural patterns or requirements are identified during development.