# Live Vendor Display & Session Management Fixes

## Issues Identified & Fixed

### Issue 1: Live Vendors Don't Appear in Map & List Views

**Root Cause**: The `/api/vendors/map-data/route.ts` endpoint was designed only for map view with active live sessions, causing both map and list views to fail when vendors are in different geographic regions or when no live sessions exist.

**Problems**:
- API always filtered for vendors with active live sessions only
- No "show all vendors" mode for list view
- Geographic bounds filtering prevented South American vendors from appearing in North American map views
- Silent failures when no vendors matched criteria

**Fix Applied**:
- Added `showAll` parameter to API endpoint
- When `showAll=true` (list view): Returns all active/approved vendors regardless of live session status
- When `showAll=false` (map view): Returns only vendors with active live sessions within bounds
- Updated frontend to pass `showAll=true` for list view mode

**Files Modified**:
- `app/api/vendors/map-data/route.ts` - Added showAll logic
- `lib/hooks/useLiveVendors.ts` - Added showAll parameter support
- `app/page.tsx` - Pass showAll based on view mode

### Issue 2: "End Live Session" Button Fails

**Root Cause**: The DELETE endpoint in `/api/vendor/go-live/route.ts` used `.single()` after an UPDATE operation, which fails when no active session exists to update.

**Problems**:
- `.single()` expects exactly one row but UPDATE with no matches returns zero rows
- Poor error handling led to generic "Failed to end live session" messages
- Users couldn't distinguish between actual errors and "no active session" scenarios

**Fix Applied**:
- Removed `.single()` call after UPDATE operation
- Added explicit check for whether any sessions were actually updated
- Return proper 404 error with descriptive message when no active session exists
- Improved error messaging for better user experience

**Files Modified**:
- `app/api/vendor/go-live/route.ts` - Fixed session ending logic

## Database Verification

The fixes were validated against the `db_723.sql` schema:

### Relevant Tables:
- `vendors` - Contains vendor profiles with status field
- `vendor_live_sessions` - Contains live session data with is_active flag
- Proper indexes exist for performance: `idx_vendor_live_sessions_active`

### Key Constraints:
- `uniq_live_active` index ensures only one active session per vendor
- `vendor_live_sessions_ended_by_check` validates ended_by field
- RLS policies properly configured for user access

## Testing

### Automated Testing Results:

**Database Structure**: ✅ Verified
- 4 active/approved vendors total
- 2 vendors with active live sessions
- 2 vendors with static locations
- 3 vendors with usable coordinates
- 1 vendor without coordinates (will not appear in either view)

**Map View Logic**: ✅ Working
- Returns 2 vendors with active live sessions
- Jake's BBQ: Live at 37.6602624, -122.4900608
- Vendor "7": Live at -12.0993425011639, -77.0205308976771

**List View Logic**: ✅ Working  
- Returns 3 vendors with any coordinates
- Tobal's Tamales: Offline with static location
- Jake's BBQ: Live with both live and static coordinates
- Vendor "7": Live with live coordinates only

**End Session Logic**: ✅ Working
- Properly returns 404 when no active session exists
- Handles edge cases without throwing errors

### Manual Testing Steps:

1. **List View Test**:
   ```bash
   curl "http://localhost:3000/api/vendors/map-data?showAll=true"
   ```
   Expected: 3 vendors with coordinates

2. **Map View Test**:
   ```bash
   curl "http://localhost:3000/api/vendors/map-data"
   ```
   Expected: 2 vendors with active live sessions

3. **End Session Test**:
   - Try ending a session when no active session exists
   - Expected: 404 with descriptive message instead of 500 error

### Test Scripts:
```bash
# Basic functionality test
node scripts/test-live-vendor-fixes.js

# Detailed API logic test  
node scripts/debug-api-endpoints.js

# Complete behavior validation
node scripts/test-complete-fixes.js
```

## Expected Behavior After Fixes

### List View:
- ✅ Shows all approved/active vendors regardless of live session status
- ✅ Vendors from any geographic location appear
- ✅ Proper fallback when no vendors exist

### Map View:
- ✅ Shows only vendors with active live sessions
- ✅ Respects geographic bounds filtering
- ✅ Real-time updates when sessions start/end

### End Live Session:
- ✅ Properly ends active sessions
- ✅ Returns 404 with clear message when no active session exists
- ✅ No more generic error messages

## Performance Considerations

- Added `showAll` parameter doesn't impact performance significantly
- Existing database indexes support both query patterns
- SWR caching in frontend prevents excessive API calls
- Geographic filtering still optimized for map view

## Backward Compatibility

- All existing API calls continue to work (default behavior unchanged)
- Frontend gracefully handles both old and new response formats
- No breaking changes to existing functionality

## Future Improvements

1. **Enhanced Error Messages**: Could add more specific error codes for different failure scenarios
2. **Geographic Search**: Could add location-based search for list view
3. **Session Management**: Could add session timeout handling
4. **Analytics**: Could track which view mode users prefer

## Deployment Notes

- No database migrations required
- Environment variables unchanged
- Can be deployed without downtime
- Recommend testing in staging environment first