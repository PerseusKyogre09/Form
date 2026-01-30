-- 1. Check if profiles table has the correct structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Expected columns: id (uuid), created_at (timestamp), username (text)

-- 2. Check if forms table has slug column
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'forms'
ORDER BY ordinal_position;

-- Expected to see: slug (text)

-- 3. Verify unique index on user_id + slug
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'forms' 
  AND indexname = 'forms_user_slug_idx';

-- Should return the unique index definition

-- 4. Check RLS policies on forms table (should allow public SELECT)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'forms';

-- Should see "Public can view forms by slug" with cmd = 'SELECT' and qual = 'true'

-- 5. Verify the helper function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_form_by_username_slug';

-- Should return the function

-- 6. Check if all existing users have profiles
SELECT 
  COUNT(*) as users_without_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;


