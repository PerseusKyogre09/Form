-- Add background customization fields to forms table
ALTER TABLE public.forms ADD COLUMN background_type VARCHAR DEFAULT 'color';
ALTER TABLE public.forms ADD COLUMN background_color VARCHAR DEFAULT '#1e293b';
ALTER TABLE public.forms ADD COLUMN background_image VARCHAR;

-- Add comments for clarity
COMMENT ON COLUMN public.forms.background_type IS 'Type of background: color or image';
COMMENT ON COLUMN public.forms.background_color IS 'Hex color code for background when background_type is color';
COMMENT ON COLUMN public.forms.background_image IS 'Public URL to background image stored in Supabase storage bucket when background_type is image';
