-- Ensure forms table schema is clean
-- Drop questions column if it still exists (it was migrated to separate questions table in migration 22)
ALTER TABLE public.forms DROP COLUMN IF EXISTS questions;

-- Verify the forms table has the correct columns
-- Expected columns: id, created_at, title, user_id, slug, published, closed, 
--                   background_type, background_color, background_image, theme, 
--                   global_text_color, updated_at, thank_you_page
