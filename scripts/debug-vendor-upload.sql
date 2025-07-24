-- Debug vendor upload issues
-- This will help us understand why the vendor update is failing

-- 1. Check what get_current_user_id() returns
SELECT 'Current User ID from function:' as debug_type, 
       public.get_current_user_id()::text as value;

-- 2. Check if there are any vendors in the database
SELECT 'Total vendors count:' as debug_type, 
       COUNT(*)::text as value 
FROM public.vendors;

-- 3. Show all vendors (limit 5 for safety)
SELECT 'Sample vendors:' as debug_type, 
       CONCAT('ID: ', id::text, ', UserID: ', user_id::text, ', Name: ', business_name) as value
FROM public.vendors 
LIMIT 5;

-- 4. Check RLS policies on vendors table
SELECT 'Vendors RLS policies:' as debug_type,
       CONCAT('Policy: ', policyname, ', Command: ', cmd, ', Roles: ', ARRAY_TO_STRING(roles, ',')) as value
FROM pg_policies 
WHERE tablename = 'vendors' AND schemaname = 'public';

-- 5. Check if RLS is enabled on vendors table
SELECT 'Vendors RLS enabled:' as debug_type,
       CASE WHEN relrowsecurity THEN 'YES' ELSE 'NO' END as value
FROM pg_class 
WHERE relname = 'vendors' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');