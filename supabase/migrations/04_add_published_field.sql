-- Add published column to forms table
ALTER TABLE public.forms ADD COLUMN published BOOLEAN DEFAULT false;

-- Update the public policy to only allow viewing published forms
DROP POLICY IF EXISTS "Public can view forms by slug" ON public.forms;
CREATE POLICY "Public can view published forms by slug"
  ON public.forms FOR SELECT
  USING (published = true);