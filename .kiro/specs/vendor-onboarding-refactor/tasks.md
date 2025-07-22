# Implementation Plan

- [x] 1. Database schema updates and constraints
  - Add unique constraints to vendors table for business_name and contact_email
  - Add require_vendor_approval field to platform_settings table
  - Create database migration script for schema changes
  - _Requirements: 5.1, 5.2, 6.1, 6.2_

- [x] 2. Enhanced vendor creation API with proper error handling
  - [x] 2.1 Update become-vendor API endpoint with unique constraint error handling
    - Modify `/api/user/become-vendor/route.ts` to catch and handle Supabase 23505 errors
    - Return user-friendly error messages for duplicate business names and emails
    - Add validation for required fields before database insertion
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 2.2 Implement session refresh functionality after vendor creation
    - Create session refresh utility function that updates NextAuth session
    - Integrate session refresh into vendor creation flow
    - Ensure immediate session update reflects new vendor role
    - _Requirements: 2.4, 2.5, 3.1, 3.2_

  - [x] 2.3 Update vendor creation to use require_vendor_approval setting
    - Modify vendor creation logic to check platform_settings.require_vendor_approval
    - Set vendor status based on approval requirement setting
    - Update existing allow_auto_vendor_approval logic to use new field
    - _Requirements: 6.2, 6.3_

- [x] 3. Middleware enhancements for vendor route protection
  - [x] 3.1 Add vendor route guards to middleware
    - Extend middleware.ts to handle /vendor/onboarding and /vendor/dashboard routes
    - Implement redirect logic for vendors accessing onboarding page
    - Implement redirect logic for non-vendors accessing dashboard
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 3.2 Test middleware route protection behavior
    - Write unit tests for middleware vendor route logic
    - Test redirect behavior for different user states
    - Verify proper handling of edge cases
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 4. Navigation component UI logic updates
  - [x] 4.1 Update Navigation component vendor status display logic
    - Modify Navigation.tsx to implement new vendor status display rules
    - Show "Vendor Dashboard" when user.is_vendor === true
    - Show "Switch to Customer" when user.active_role === 'vendor'
    - Show "Become a Vendor" when user.is_vendor === false AND active_role === 'customer'
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 4.2 Implement session refresh in Navigation component
    - Add session refresh calls after role switching operations
    - Ensure UI updates immediately after role changes
    - Handle loading states during role transitions
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 5. Vendor onboarding page improvements
  - [x] 5.1 Add route guard to vendor onboarding page
    - Check if user is already a vendor and redirect to dashboard
    - Implement proper loading states during auth checks
    - Handle edge cases where vendor status is unclear
    - _Requirements: 7.1, 7.4_

  - [x] 5.2 Enhance error handling and display in onboarding form
    - Update form submission error handling to display specific constraint violation messages
    - Add client-side validation for business name and email uniqueness
    - Improve user feedback for form validation errors
    - _Requirements: 5.3, 5.4_

  - [x] 5.3 Implement proper redirect after successful vendor creation
    - Ensure redirect to /vendor/dashboard after successful onboarding
    - Trigger session refresh before redirect
    - Handle redirect timing to ensure session is updated
    - _Requirements: 2.5, 3.2_

- [x] 6. Vendor dashboard page route protection
  - [x] 6.1 Add route guard to vendor dashboard page
    - Check if user has vendor profile and redirect to onboarding if not
    - Implement proper loading states during vendor profile checks
    - Handle cases where vendor profile exists but user.is_vendor is false
    - _Requirements: 7.2, 7.4_

  - [x] 6.2 Update dashboard to rely on session data
    - Modify dashboard to use session data for vendor status checks
    - Remove redundant database calls for user profile verification
    - Ensure dashboard reflects updated session after onboarding
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 7. Admin settings for vendor approval control
  - [x] 7.1 Add require_vendor_approval toggle to admin settings
    - Create admin settings page at /admin/settings if it doesn't exist
    - Update admin settings page to include vendor approval toggle
    - Implement API endpoint for updating platform settings
    - Add proper validation and error handling for settings updates
    - run vercel build after and deal with any errors that arise
    - _Requirements: 6.4_

  - [x] 7.2 Update admin vendor management interface
    - Modify admin vendor pages to show approval status
    - Add controls for approving/rejecting pending vendors
    - Display vendor approval requirement status in admin interface
    - run vercel build after and deal with any errors that arise
    - _Requirements: 6.4_

- [x] 8. Comprehensive testing and validation
- run vercel build after and deal with any errors that arise
  - [x] 8.1 Write unit tests for vendor creation and session management
    - Test vendor creation API with various input scenarios
    - Test unique constraint error handling
    - Test session refresh functionality
    - run vercel build after and deal with any errors that arise
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4_

  - [x] 8.2 Write integration tests for complete vendor onboarding flow
    - Test end-to-end vendor onboarding from form submission to dashboard access
    - Test role switching and session updates
    - Test middleware route protection behavior
    - run vercel build after and deal with any errors that arise
    - _Requirements: 1.1, 1.2, 1.3, 7.1, 7.2, 7.3, 7.4_

  - [x] 8.3 Write E2E tests for user journey and error scenarios
    - Test complete user journey from sign up to vendor dashboard access
    - Test error scenarios including duplicate names and emails
    - Test admin approval workflow if enabled
    - run vercel build after and deal with any errors that arise
    - _Requirements: All requirements validation_

- [-] 9. Database type generation and cleanup
- run vercel build after and deal with any errors that arise
  - [ ] 9.1 Regenerate database types to include new fields
    - Update Supabase types to include require_vendor_approval field
    - Remove temporary type casting (as any) from codebase
    - Ensure all database fields are properly typed
    - remove any files scripts or anything that is no longer needed, clean up the codebase and workspace 
    - run vercel build after and deal with any errors that arise
    - _Requirements: Technical debt cleanup_