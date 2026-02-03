-- Add theme field to forms table
-- The theme is stored as JSONB to support the full Theme object with cssUrl, fontUrl, colors, etc.
ALTER TABLE forms ADD COLUMN IF NOT EXISTS theme jsonb;

-- Update the get_form_by_slug function to include theme
CREATE OR REPLACE FUNCTION get_form_by_slug(p_username TEXT, p_slug TEXT)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  questions jsonb,
  published boolean,
  closed boolean,
  background_type text,
  background_color text,
  background_image text,
  theme jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.slug,
    f.title,
    f.questions,
    f.published,
    f.closed,
    f.background_type,
    f.background_color,
    f.background_image,
    f.theme
  FROM forms f
  JOIN profiles p ON f.user_id = p.id
  WHERE p.username = p_username
    AND f.slug = p_slug
    AND f.published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
