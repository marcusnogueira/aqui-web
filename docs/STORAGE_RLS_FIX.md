# 🚀 **Storage RLS Policy Fix for NextAuth**

## **Problem Summary**

Your Supabase Storage image uploads were failing with `403 unauthorized: new row violates row-level security policy` because:

1. **Your project migrated from Supabase Auth to NextAuth** - but Storage RLS policies weren't updated
2. **Storage policies still used `auth.uid()`** - which returns `null` with NextAuth
3. **Upload routes weren't setting proper session context** for NextAuth RLS compatibility

## **Root Cause**

### **Before (Broken)**
```sql
-- ❌ This doesn't work with NextAuth
CREATE POLICY "Allow vendors to upload to their own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'vendor-images'
  AND EXISTS (
    SELECT 1 FROM public.vendors
    WHERE vendors.id = (storage.foldername(name))[1]::uuid
      AND vendors.user_id = auth.uid()  -- Returns NULL with NextAuth!
  )
);
```

### **After (Fixed)**
```sql
-- ✅ This works with NextAuth
CREATE POLICY "Allow vendors to upload to their own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'vendor-images'
  AND EXISTS (
    SELECT 1 FROM public.vendors
    WHERE vendors.id = (storage.foldername(name))[1]::uuid
      AND vendors.user_id = public.get_current_user_id()  -- Works with NextAuth!
  )
);
```

## **Files Changed**

### **1. Database Policies**
- **Added**: `scripts/fix-storage-rls-policy.sql` - Updates Storage RLS policies
- **Added**: `scripts/deploy-storage-fix.js` - Deployment script

### **2. API Routes**
- **Updated**: `app/api/vendor/upload-image/route.ts`
  - Added proper NextAuth session context setup
  - Uses `setUserContext()` and `clearUserContext()`
  
- **Updated**: `app/api/vendors/gallery/upload/route.ts`
  - Added proper NextAuth session context setup
  - Uses `setUserContext()` and `clearUserContext()`

## **Deployment Instructions**

### **Step 1: Deploy the SQL Fix**

```bash
# Run the deployment script
node scripts/deploy-storage-fix.js
```

**OR manually run the SQL in your Supabase dashboard:**

```sql
-- Copy and paste the contents of scripts/fix-storage-rls-policy.sql
-- into your Supabase SQL Editor and execute
```

### **Step 2: Test the Fix**

1. **Test vendor image uploads**:
   - Go to `/vendor/dashboard`
   - Try uploading profile/banner images
   - Should work without 403 errors

2. **Test gallery uploads**:
   - Use the gallery section in vendor dashboard
   - Upload multiple images
   - Should work without 403 errors

3. **Check the logs**:
   - Monitor server logs for any remaining RLS errors
   - Watch for successful upload confirmations

## **How the Fix Works**

### **Session Context Setup**

The updated upload routes now properly set the NextAuth session context:

```typescript
// ✅ Before any Supabase operations
await setUserContext(supabase, session.user.id)

// Your Supabase storage operations here...

// ✅ Always clean up afterward
await clearUserContext(supabase)
```

### **RLS Policy Update**

The storage policies now use the NextAuth-compatible function:

```sql
-- ✅ Works with NextAuth session context
WHERE vendors.user_id = public.get_current_user_id()
```

## **Verification**

### **Successful Upload Should Show:**
```
☁️ Uploading to storage...
✅ File uploaded: {vendor-id}/{filename}
🔗 Creating signed URL...
✅ Signed URL created: https://...
```

### **Failed Upload Would Show:**
```
❌ Upload error: new row violates row-level security policy
```

## **Troubleshooting**

### **If uploads still fail:**

1. **Check session context is being set**:
   ```typescript
   // Make sure this is called before Supabase operations
   await setUserContext(supabase, session.user.id)
   ```

2. **Verify the SQL was applied**:
   - Go to Supabase Dashboard → Authentication → Policies
   - Check `storage.objects` table has the new policies

3. **Test with a fresh user session**:
   - Sign out and sign back in
   - Try uploading again

4. **Check the vendor ownership**:
   ```sql
   -- This query should return the vendor for the current user
   SELECT id, user_id FROM vendors 
   WHERE user_id = public.get_current_user_id()
   ```

## **Additional Notes**

- **Client-side uploads** (from React components) should also work because they'll use the same updated RLS policies
- **The fix is comprehensive** - includes INSERT, SELECT, UPDATE, and DELETE policies for complete storage access control
- **Backward compatible** - doesn't break any existing functionality

## **Related Files**

For more context on NextAuth RLS integration:
- `lib/nextauth-context.ts` - NextAuth session context helpers
- `scripts/nextauth_rls_functions.sql` - Core RLS functions for NextAuth
- `db_723.sql` - Current database schema with NextAuth functions