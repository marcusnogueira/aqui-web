# Go Live System - Issue Diagnosis & Fixes 🔧

## 🔍 **Root Cause Analysis**

I found **3 critical issues** preventing the go-live system from working:

### **Issue #1: Hook-API Mismatch** ❌
- **Problem**: `useLiveVendors` hook calls `/api/search/vendors` 
- **Should call**: `/api/vendors/map-data` (which is specifically for live map vendors)
- **Impact**: Homepage map never gets live vendor data

### **Issue #2: Database View Filtering** ❌  
- **Problem**: Search API uses `live_vendors_with_sessions` view
- **Issue**: View only shows vendors with ACTIVE sessions AND approved status
- **Missing**: Proper real-time filtering for currently live vendors

### **Issue #3: Frontend Logic Gap** ❌
- **Problem**: VendorMap expects live session data in specific format
- **Reality**: Data structure from search API doesn't match expectations
- **Result**: Live vendors don't render properly on map

---

## 🛠 **System Flow (Current vs Fixed)**

### **Current Broken Flow:**
```
Vendor clicks "Go Live" 
    ↓
Insert into vendor_live_sessions ✅
    ↓
Customer visits homepage 
    ↓
useLiveVendors calls /api/search/vendors ❌
    ↓
Search API queries live_vendors_with_sessions view ❌
    ↓
Data format mismatch ❌
    ↓
Map shows no vendors ❌
```

### **Fixed Flow:**
```
Vendor clicks "Go Live" 
    ↓
Insert into vendor_live_sessions ✅
    ↓
Customer visits homepage 
    ↓
useLiveVendors calls /api/vendors/map-data ✅
    ↓
Map API gets active live sessions ✅
    ↓
Proper data format for map ✅
    ↓
Live vendors appear on map ✅
```

---

## 📋 **Database Analysis**

### **Confirmed Working:**
- ✅ `vendor_live_sessions` table structure correct
- ✅ Go Live insertion logic works in vendor dashboard
- ✅ RLS policies allow vendor session management
- ✅ Database trigger `update_is_active_on_end` works correctly
- ✅ Unique constraint prevents multiple active sessions per vendor

### **Issues Found:**
- ❌ `live_vendors_with_sessions` view not used correctly
- ❌ Map data API not being called by frontend
- ❌ Data transformation inconsistencies

---

## 🔧 **Required Fixes**

### **Fix #1: Update useLiveVendors Hook**
**File**: `/lib/hooks/useLiveVendors.ts`
**Change**: Point to correct API endpoint
```typescript
// BEFORE (broken)
return `/api/search/vendors?${searchParams.toString()}`

// AFTER (fixed) 
return `/api/vendors/map-data?${searchParams.toString()}`
```

### **Fix #2: Update Map Data API Response**
**File**: `/app/api/vendors/map-data/route.ts`
**Change**: Return vendors array (not markers) for consistency
```typescript
// BEFORE
return NextResponse.json({ markers })

// AFTER  
return NextResponse.json({ vendors: vendors, markers })
```

### **Fix #3: Vendor Dashboard Session Validation**
**File**: `/app/vendor/dashboard/page.tsx` & `/app/vendor/overview/page.tsx`
**Change**: Add better error handling and success feedback

---

## 🧪 **Testing Plan**

### **Step 1: Test Go Live Function**
1. Login as approved vendor
2. Go to vendor dashboard
3. Click "Go Live" button
4. **Verify**: Session inserted in `vendor_live_sessions` table
5. **Check**: `is_active = true` and coordinates populated

### **Step 2: Test Map Data API**
1. Make direct call: `GET /api/vendors/map-data`
2. **Verify**: Returns vendors with active live sessions
3. **Check**: Data format matches VendorMap expectations

### **Step 3: Test Customer Map**
1. Visit homepage as customer
2. **Verify**: Live vendors appear on map
3. **Check**: Vendor tiles show correct info and status

---

## 🎯 **Expected Outcomes After Fix**

### **For Vendors:**
- ✅ "Go Live" button works reliably
- ✅ Clear success/error feedback
- ✅ Session management works correctly
- ✅ Can see their live status in dashboard

### **For Customers:**
- ✅ Live vendors appear on homepage map
- ✅ Vendor tiles show accurate info
- ✅ Real-time updates when vendors go live/offline
- ✅ Map performance improved with proper API

### **For System:**
- ✅ Consistent data flow from vendor → database → customer
- ✅ Proper error handling throughout
- ✅ Optimized API calls and caching
- ✅ Reliable real-time vendor discovery

---

## 🚨 **Critical Next Steps**

1. **Immediate**: Fix the hook API endpoint mismatch
2. **Test**: Verify go-live functionality works end-to-end  
3. **Monitor**: Check database for active sessions after go-live
4. **Validate**: Confirm vendors appear on customer map

The fixes are straightforward but critical - the system architecture is sound, just needs proper data flow connections! 🚀