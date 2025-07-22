# Design Document

## Overview

This design refactors the vendor onboarding flow and role logic to create a seamless user experience where users can become vendors through a complete profile creation process. The system will ensure proper session management, role updates, UI state synchronization, unique constraint enforcement, admin approval workflows, and appropriate route guards.

The refactor addresses current inconsistencies in the vendor onboarding flow, improves session management, and provides a more intuitive user experience with proper error handling and validation.

## Architecture

### Current State Analysis

The existing system has:
- NextAuth.js for authentication with custom Supabase adapter
- Vendor onboarding page at `/vendor/onboarding`
- Vendor dashboard at `/vendor/dashboard`
- API endpoint `/api/user/become-vendor` for vendor creation
- Navigation component with role switching logic
- Middleware for route protection (currently focused on admin routes)

### Proposed Architecture Changes

1. **Enhanced Middleware**: Extend middleware to handle vendor-specific route guards
2. **Session Management**: Implement immediate session refresh after vendor creation
3. **Database Constraints**: Add unique constraints and proper error handling
4. **UI State Management**: Improve Navigation component logic for vendor status display
5. **Admin Settings**: Utilize existing `platform_settings` table for vendor approval control

## Components and Interfaces

### 1. Database Schema Updates

#### Unique Constraints
```sql
-- Add unique constraints to vendors table
ALTER TABLE vendors ADD CONSTRAINT vendors_business_name_unique UNIQUE (business_name);
ALTER TABLE vendors ADD CONSTRAINT vendors_contact_email_unique UNIQUE (contact_email);
```

#### Platform Settings Enhancement
The existing `platform_settings` table already has:
- `allow_auto_vendor_approval: boolean` (currently used)

We need to add:
- `require_vendor_approval: boolean` (new field for clearer semantics)

### 2. API Endpoints

#### Enhanced `/api/user/become-vendor`
- **Input Validation**: Validate required fields and uniqueness
- **Error Handling**: Handle Supabase 23505 errors for unique constraint violations
- **Session Refresh**: Trigger session update after successful vendor creation
- **Platform Settings**: Check `require_vendor_approval` setting

#### New `/api/auth/refresh-session`
- **Purpose**: Force session refresh after role changes
- **Implementation**: Update NextAuth session with latest user data

### 3. Middleware Updates

#### Enhanced Route Guards
```typescript
// Vendor-specific route protection
if (pathname.startsWith('/vendor/')) {
  if (pathname === '/vendor/onboarding') {
    // If already a vendor, redirect to dashboard
    if (auth?.user?.is_vendor) {
      return NextResponse.redirect(new URL('/vendor/dashboard', req.url))
    }
  } else if (pathname === '/vendor/dashboard') {
    // If not a vendor, redirect to onboarding
    if (!auth?.user?.is_vendor) {
      return NextResponse.redirect(new URL('/vendor/onboarding', req.url))
    }
  }
}
```

### 4. Component Updates

#### Navigation Component
Enhanced logic for vendor status display:
```typescript
// Profile dropdown logic
if (user.is_vendor === true) {
  // Always show "Vendor Dashboard"
  showVendorDashboard = true
  
  if (user.active_role === 'vendor') {
    // Show "Switch to Customer"
    showSwitchToCustomer = true
  }
} else if (user.is_vendor === false && user.active_role === 'customer') {
  // Show "Become a Vendor"
  showBecomeVendor = true
}
```

#### Vendor Onboarding Page
- **Route Guard**: Check if user is already a vendor
- **Form Validation**: Client-side validation with server-side backup
- **Error Display**: Clear error messages for unique constraint violations
- **Success Handling**: Redirect to dashboard after successful creation

#### Vendor Dashboard Page
- **Route Guard**: Check if user has vendor profile
- **Session Dependency**: Rely on updated session data

## Data Models

### User Model Updates
```typescript
interface User {
  id: string
  email: string
  is_vendor: boolean
  active_role: 'customer' | 'vendor' | 'admin'
  // ... other fields
}
```

### Vendor Model
```typescript
interface Vendor {
  id: string
  user_id: string
  business_name: string // UNIQUE
  contact_email: string // UNIQUE
  status: 'pending' | 'approved' | 'rejected'
  // ... other fields
}
```

### Platform Settings Model
```typescript
interface PlatformSettings {
  id: boolean // Primary key (always true)
  allow_auto_vendor_approval: boolean // Existing
  require_vendor_approval: boolean // New field
}
```

## Error Handling

### Database Constraint Violations
```typescript
// Handle Supabase unique constraint errors (23505)
if (error.code === '23505') {
  if (error.message.includes('vendors_business_name_unique')) {
    return { error: 'Vendor name already taken' }
  }
  if (error.message.includes('vendors_contact_email_unique')) {
    return { error: 'Email already registered' }
  }
}
```

### Session Management Errors
- **Stale Session**: Implement retry logic for session refresh using `router.refresh()` or `signIn('credentials', { redirect: false })` to sync session post-role change
- **Role Mismatch**: Handle cases where session doesn't match database state
- **Network Errors**: Graceful degradation with user feedback

### Route Guard Errors
- **Unauthorized Access**: Redirect to appropriate page with context
- **Missing Profile**: Clear error messages and guidance
- **Session Timeout**: Redirect to login with return URL

## Testing Strategy

### Unit Tests
- **API Endpoints**: Test vendor creation, validation, and error handling
- **Utility Functions**: Test session refresh and role switching logic
- **Components**: Test Navigation component state changes

### Integration Tests
- **Vendor Onboarding Flow**: End-to-end test from form submission to dashboard access
- **Session Management**: Test session updates after role changes
- **Route Guards**: Test middleware behavior for different user states

### E2E Tests
- **Complete User Journey**: Sign up → Become Vendor → Access Dashboard
- **Error Scenarios**: Test unique constraint violations and error display
- **Admin Approval Flow**: Test pending/approved vendor states

## Implementation Phases

### Phase 1: Database and API Updates
1. Add unique constraints to vendors table
2. Update `/api/user/become-vendor` with enhanced error handling
3. Add session refresh functionality
4. Update platform settings schema

### Phase 2: Middleware and Route Guards
1. Enhance middleware with vendor route protection
2. Implement proper redirects for vendor routes
3. Test route guard behavior

### Phase 3: UI and Component Updates
1. Update Navigation component logic
2. Enhance vendor onboarding page with better error handling
3. Update vendor dashboard with proper route guards
4. Implement session refresh in UI

### Phase 4: Admin Interface
1. Add vendor approval toggle to admin settings (consider dedicated admin settings panel for future scaling)
2. Update admin vendor management interface
3. Test admin approval workflow

## Security Considerations

### Data Validation
- **Server-side Validation**: All form inputs validated on server
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Prevention**: Sanitize user inputs

### Access Control
- **Route Protection**: Middleware enforces proper access
- **API Security**: Verify user authentication and authorization
- **Session Security**: Secure session management with proper expiration

### Privacy
- **Data Minimization**: Only collect necessary vendor information
- **Consent Management**: Clear terms for vendor data usage
- **Data Retention**: Proper cleanup of rejected vendor applications