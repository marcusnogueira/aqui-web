# Comprehensive Plan of Attack (2025-07-22)

This plan addresses all validated issues from the task list and prioritizes them based on impact and dependencies.

## Priority 1: Critical Fixes & Core Functionality

These tasks are essential for the basic, stable operation of the platform's vendor features.

### 1. Fix Onboarding Flow

*   **Issue**: The vendor onboarding form incorrectly redirects to a confirmation page instead of the vendor dashboard.
*   **File**: `app/vendor/onboarding/page.tsx`
*   **Change**: Modify the `handleSubmit` function to redirect to `/vendor/dashboard`.
*   **Justification**: Aligns with the required user flow and provides immediate access to the dashboard.

### 2. Implement Vendor Approval Logic

*   **Issue**: The logic for vendor auto-approval is not implemented, and there are redundant database flags.
*   **Files**: `app/vendor/onboarding/page.tsx`, `app/api/user/become-vendor/route.ts` (to be confirmed), `supabase/migrations/20250721220000_add_require_vendor_approval_only.sql`
*   **Actions**:
    *   Investigate the vendor creation API to confirm how `status` is set.
    *   Implement logic to respect the `allow_auto_vendor_approval` flag.
    *   Consolidate the redundant `require_vendor_approval` and `allow_auto_vendor_approval` flags into one.
*   **Justification**: This is a critical platform control for managing vendor quality and access.

## Priority 2: Missing Core Features

These are key features that are either completely missing or incomplete, and are vital for user engagement.

### 1. Implement Review Submission

*   **Issue**: Users cannot submit reviews for vendors.
*   **Action**: Create an API route (`app/api/reviews/route.ts`) and a submission form on `app/vendor/[id]/page.tsx`.
*   **Details**: The API must validate that the user is a logged-in customer.
*   **Justification**: Enables a core feature for user-generated content and social proof.

### 2. Implement Favorites Functionality

*   **Issue**: Users cannot favorite vendors.
*   **Action**: Create an API route (`app/api/favorites/route.ts`) and a favorite/unfavorite toggle button on the vendor profile page.
*   **Details**: Create a new page for users to view their favorited vendors.
*   **Justification**: Crucial for user retention, personalization, and future recommendations.

### 3. Implement Vendor Photo Gallery

*   **Issue**: Vendors can only upload a single banner image, not a gallery.
*   **Files**: `app/vendor/dashboard/page.tsx`, `app/vendor/[id]/page.tsx`
*   **Actions**:
    *   Allow multiple banner image uploads in the vendor dashboard.
    *   Update the `saveProfile` function to handle an array of images.
    -   Display the images in a gallery layout on the public vendor profile.
*   **Justification**: Allows vendors to properly showcase their offerings.

## Priority 3: UX and UI Enhancements

These tasks will improve the user experience, making the platform more professional and user-friendly.

