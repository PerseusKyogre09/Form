-- Add closed column to forms table for form submission control
ALTER TABLE public.forms ADD COLUMN closed BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.forms.closed IS 'When true, the form no longer accepts new responses';
