# Vendor Live Status - Source of Truth & Verification Guide

## 📋 Source of Truth for Vendor Live Status

The source of truth for determining which vendors should be live is based on **three key database tables**:

### 1. `vendors` Table
- **`is_active`**: Boolean indicating if vendor account is active
- **`is_approved`**: Boolean indicating if vendor has been approved by admin
- **Location**: `latitude`, `longitude`, `city`, `address`

### 2. `vendor_live_sessions` Table
- **`is_active`**: Boolean indicating if the live session is currently active
- **`vendor_id`**: Foreign key linking to vendors table
- **`start_time`**: When the live session started
- **`end_time`**: When the live session ended (NULL if still active)
- **`auto_end_time`**: Automatic end time for the session
- **Location**: `latitude`, `longitude`, `address`

### 3. Business Logic
A vendor should be live and visible on the map if:
```sql
SELECT v.*, vls.*
FROM vendors v
JOIN vendor_live_sessions vls ON v.id = vls.vendor_id
WHERE v.is_active = true
  AND v.is_approved = true
  AND vls.is_active = true
  AND vls.latitude IS NOT NULL
  AND vls.longitude IS NOT NULL;
```

## 🗂️ Database Schema Reference

### Vendors Table Structure
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "business_name": "text",
  "is_active": "boolean (default: true)",
  "is_approved": "boolean (default: false)",
  "latitude": "double precision",
  "longitude": "double precision",
  "city": "text",
  "address": "text"
}
```

### Vendor Live Sessions Table Structure
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "start_time": "timestamp with time zone",
  "end_time": "timestamp with time zone",
  "auto_end_time": "timestamp with time zone",
  "latitude": "double precision",
  "longitude": "double precision",
  "address": "text",
  "is_active": "boolean (default: true)"
}
```

## 🔧 Verification Scripts

### 1. Main Analysis Script: `analyze-vendor-live-status.js`
**Purpose**: Identifies vendors that should be live based on database criteria

**Usage**:
```bash
node scripts/analyze-vendor-live-status.js
```

**What it checks**:
- Active and approved vendors
- Current live sessions
- Coordinate validation
- Session timing

### 2. Debug Script: `debug-live-sessions.js`
**Purpose**: Validates live session data and geographic filtering

**Usage**:
```bash
node scripts/debug-live-sessions.js
```

**What it checks**:
- Live session coordinates
- Map bounds filtering (San Francisco area)
- Vendor approval status
- Geographic distribution

### 3. SF Vendor Creator: `create-sf-vendors.js`
**Purpose**: Creates live vendor sessions in San Francisco area for testing

**Usage**:
```bash
node scripts/create-sf-vendors.js
```

**What it does**:
- Finds vendors without active sessions
- Creates live sessions at SF landmarks
- Sets 4-hour session duration
- Provides immediate map visibility

## 🗺️ Geographic Filtering

The application filters vendors by map bounds. For San Francisco:

```javascript
const SF_BOUNDS = {
  north: 37.8324,
  south: 37.7049,
  east: -122.3482,
  west: -122.5161
};
```

Vendors outside these bounds won't appear when the map is centered on SF.

## 🔍 Common Issues & Solutions

### Issue: "No vendors showing on map"
**Possible causes**:
1. **No active sessions in map bounds**
   - Solution: Run `create-sf-vendors.js` to add SF vendors
   
2. **Vendors not approved**
   - Check: `vendors.is_approved = false`
   - Solution: Update vendor approval status
   
3. **Sessions expired**
   - Check: `vendor_live_sessions.is_active = false`
   - Solution: Create new active sessions
   
4. **Missing coordinates**
   - Check: `latitude` or `longitude` is NULL
   - Solution: Update session coordinates

### Issue: "Vendors approved but not live"
**Check sequence**:
1. Vendor is active: `vendors.is_active = true`
2. Vendor is approved: `vendors.is_approved = true`
3. Has active session: `vendor_live_sessions.is_active = true`
4. Session has coordinates: `latitude/longitude NOT NULL`
5. Coordinates within map bounds

## 📊 Current Status (Last Check)

```
✅ Total eligible vendors: 37
✅ Active live sessions: 18
✅ Vendors in SF bounds: 10
✅ Vendors outside SF: 8
```

## 🚀 Quick Commands

```bash
# Check current live status
node scripts/analyze-vendor-live-status.js

# Debug geographic filtering
node scripts/debug-live-sessions.js

# Add vendors to SF area
node scripts/create-sf-vendors.js

# View schema
cat schema.json | jq '.vendors, .vendor_live_sessions'
```

## 📝 Notes

- Live sessions auto-expire based on `auto_end_time`
- Frontend uses real-time subscriptions for live updates
- Map bounds filtering happens client-side
- Vendor approval is required for visibility
- Geographic coordinates are essential for map display

---

*This guide provides the complete source of truth for vendor live status determination and verification tools.*