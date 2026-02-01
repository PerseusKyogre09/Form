-- Drop and recreate the get_form_by_username_slug function to include the closed field
DROP FUNCTION IF EXISTS public.get_form_by_username_slug(p_username TEXT, p_slug TEXT);

CREATE FUNCTION public.get_form_by_username_slug(p_username TEXT, p_slug TEXT)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  title TEXT,
  questions JSONB,
  user_id UUID,
  slug TEXT,
  published BOOLEAN,
  closed BOOLEAN
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.created_at,
    f.title,
    f.questions,
    f.user_id,
    f.slug,
    f.published,
    f.closed
  FROM public.forms f
  INNER JOIN public.profiles p ON f.user_id = p.id
  WHERE p.username = p_username AND f.slug = p_slug AND f.published = true;
END;
$$ LANGUAGE plpgsql;
