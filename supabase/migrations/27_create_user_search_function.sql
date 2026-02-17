-- Create a Postgres function to search users
-- This is necessary because auth.users table is not directly queryable via REST API
-- Handles both email signups and OAuth (GitHub, Google, etc)

CREATE OR REPLACE FUNCTION public.search_users(search_query TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  username TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    COALESCE(
      u.user_metadata->>'username',
      u.user_metadata->>'user_name',
      u.raw_user_meta_data->>'user_name',
      u.user_metadata->>'name',
      u.raw_user_meta_data->>'name',
      SPLIT_PART(u.email, '@', 1)
    )::TEXT as username
  FROM auth.users u
  WHERE 
    (u.email ILIKE '%' || search_query || '%' 
     OR u.user_metadata->>'username' ILIKE '%' || search_query || '%'
     OR u.user_metadata->>'user_name' ILIKE '%' || search_query || '%'
     OR u.raw_user_meta_data->>'user_name' ILIKE '%' || search_query || '%'
     OR u.user_metadata->>'name' ILIKE '%' || search_query || '%'
     OR u.raw_user_meta_data->>'name' ILIKE '%' || search_query || '%')
    AND u.id != auth.uid()  -- Exclude current user
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.search_users(TEXT) TO authenticated;
