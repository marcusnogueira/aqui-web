# Requirements Document

## Introduction

This feature refactors the vendor onboarding flow and role logic to ensure a seamless user experience where users can become vendors through a complete profile creation process, with proper session management, role updates, and UI state synchronization. The system will enforce unique constraints, support admin approval workflows, and provide appropriate route guards.

## Requirements

### Requirement 1

**User Story:** As a user, I want to land on the homepage after login regardless of my role, so that I have a consistent entry point to the application.

#### Acceptance Criteria

1. WHEN a user successfully logs in THEN the system SHALL redirect them to the homepage (/)
2. WHEN a user logs in AND they are already a vendor THEN the system SHALL NOT automatically redirect them to the vendor dashboard
3. WHEN middleware processes a login redirect THEN it SHALL allow all authenticated users to access the homepage

### Requirement 2

**User Story:** As a user, I want to become a vendor through a complete profile creation process, so that I can start offering my services on the platform.

#### Acceptance Criteria

1. WHEN a user clicks "Become a Vendor" THEN the system SHALL display a vendor profile creation form
2. WHEN a user submits the vendor creation form THEN the system SHALL insert a new record into the vendors table
3. WHEN vendor creation is successful THEN the system SHALL update the user's record to set is_vendor = true AND active_role = 'vendor'
4. WHEN vendor creation is successful THEN the system SHALL immediately refresh the user's session to reflect the new role
5. WHEN vendor creation is successful THEN the system SHALL redirect the user to /vendor/dashboard

### Requirement 3

**User Story:** As a user, I want the UI to immediately reflect my vendor status after onboarding, so that I can access vendor-specific features without confusion.

#### Acceptance Criteria

1. WHEN a user completes vendor onboarding THEN the session SHALL show is_vendor: true AND active_role: 'vendor'
2. WHEN the UI renders after vendor onboarding THEN it SHALL display "Vendor Dashboard" instead of "Become a Vendor"
3. WHEN a user's session is updated THEN useSession() SHALL return the updated role information

### Requirement 4

**User Story:** As a user, I want to see appropriate navigation options based on my vendor status, so that I can easily access relevant features.

#### Acceptance Criteria

1. WHEN a user has is_vendor === true THEN the profile dropdown SHALL display "Vendor Dashboard"
2. WHEN a user has active_role === 'vendor' THEN the profile dropdown SHALL display "Switch to Customer"
3. WHEN a user has is_vendor === false AND active_role === 'customer' THEN the profile dropdown SHALL display "Become a Vendor"

### Requirement 5

**User Story:** As a platform administrator, I want to enforce unique vendor names and contact emails, so that there are no duplicate vendor identities on the platform.

#### Acceptance Criteria

1. WHEN a vendor name already exists THEN the system SHALL return a "Vendor name already taken" error
2. WHEN a contact email already exists THEN the system SHALL return a "Email already registered" error
3. WHEN the database enforces uniqueness constraints THEN the API SHALL handle Supabase 23505 errors gracefully
4. WHEN uniqueness violations occur THEN the system SHALL display clear error messages to the user

### Requirement 6

**User Story:** As a platform administrator, I want to control whether vendor applications require approval, so that I can maintain quality standards when needed.

#### Acceptance Criteria

1. WHEN the platform_settings table exists THEN it SHALL have a require_vendor_approval boolean field with default false
2. WHEN require_vendor_approval is true THEN new vendors SHALL be created with status = 'pending'
3. WHEN require_vendor_approval is false THEN new vendors SHALL be created with status = 'approved'
4. WHEN an admin accesses the admin panel THEN they SHALL be able to toggle the vendor approval requirement (via admin UI or directly in the platform_settings table for now)

### Requirement 7

**User Story:** As a user, I want to be properly routed based on my vendor status, so that I don't access inappropriate pages.

#### Acceptance Criteria

1. WHEN a user who is already a vendor accesses /vendor/onboarding THEN the system SHALL redirect them to /vendor/dashboard
2. WHEN a user who is not a vendor accesses /vendor/dashboard THEN the system SHALL redirect them to /vendor/onboarding
3. WHEN middleware processes vendor routes THEN it SHALL enforce appropriate access controls (e.g., only vendors can access /vendor/dashboard)
4. WHEN route guards are triggered THEN they SHALL redirect users to the appropriate destination