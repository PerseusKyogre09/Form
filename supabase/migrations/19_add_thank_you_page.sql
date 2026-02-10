-- Add thank_you_page field to forms table
-- The thank you page configuration is stored as JSONB to support full customization
ALTER TABLE forms ADD COLUMN IF NOT EXISTS thank_you_page jsonb;

-- Drop the existing function first to recreate it with the new column
DROP FUNCTION IF EXISTS get_form_by_slug(text, text);

-- Recreate the get_form_by_slug function to include thank_you_page
CREATE FUNCTION get_form_by_slug(p_username TEXT, p_slug TEXT)
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
  theme jsonb,
  thank_you_page jsonb
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
    f.theme,
    f.thank_you_page
  FROM forms f
  JOIN profiles p ON f.user_id = p.id
  WHERE p.username = p_username
    AND f.slug = p_slug
    AND f.published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
