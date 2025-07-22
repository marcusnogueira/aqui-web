# ✅ AQUI Platform: Finalization Tasks (2025-07-22)

## 1. 📸 Vendor Photo Uploads & Persistence
Ensure vendors can upload and persist:
- [ ] Profile photo (PNG, JPEG)
- [ ] Featured gallery photos (PNG, JPEG)
- [ ] Images saved persistently and retrievable from DB
- [ ] Images displayed as a **gallery layout** in vendor dashboard and Explore page
- [ ] Support upload from vendor dashboard only (not onboarding)
- [ ] Handle image deletion and update from dashboard correctly

## 2. 🌟 Reviews & Favorites Behavior
- [ ] Only logged-in users can submit reviews
- [ ] Only customers (not vendors/admins) can review vendors
- [ ] Reviews should persist in the database
- [ ] Reviews should be viewable on vendor profile
- [ ] Customers can unfavorite vendors (toggle mechanism)
- [ ] Favorited vendors persist in customer profile and reflect in admin analytics

## 3. 💬 Feedback + Admin Metrics Routing
- [ ] Vendor-submitted feedback routes into Admin Feedback portal
- [ ] Feedback table supports:
  - Vendor ID
  - Feedback message
  - Timestamp
- [ ] Admin dashboard displays full feedback list
- [ ] Reviews, favorites, and live analytics all route to correct admin views

## 4. 🛑 Platform Controls: Vendor Approval Enforcement
- [ ] Respect `platform_settings.allow_auto_vendor_approval` flag
  - [ ] If `false`, vendors are created with `status: 'pending'`
  - [ ] Admins must manually approve vendor in admin dashboard
  - [ ] Vendor cannot go live if pending
  - [ ] Show error: "Your vendor profile is pending approval from an admin"
- [ ] If `true`, vendor is auto-approved and can go live immediately

## 5. 🧭 Onboarding Flow Fix
- [ ] Clicking **Complete Setup**:
  - [ ] Inserts vendor into DB
  - [ ] Redirects directly to `/vendor/dashboard` (NOT confirmation page)
  - [ ] Sets session to `is_vendor: true`, `active_role: 'vendor'`
  - [ ] Displays `Vendor Dashboard` in nav
  - [ ] Saves progress even if the page is refreshed or revisited
- [ ] Disable `/vendor/onboarding/confirmation` route unless manually accessed

## 6. 🧠 Optional: UX Enhancements
- [ ] When onboarding fails or is blocked (e.g., duplicate vendor), show proper error toast
- [ ] Explore form validation edge cases (e.g., invalid email, missing business name)

## 7. 🔍 Vendor Feedback UI
- [ ] Use current vendor dashboard portal for submitting feedback
- [ ] No behavior changes required — just verify indexing & persistence
