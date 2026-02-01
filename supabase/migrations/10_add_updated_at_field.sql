-- Add updated_at column to forms table for tracking last edit time
ALTER TABLE public.forms 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create an index on updated_at for efficient sorting by recent edits
CREATE INDEX IF NOT EXISTS idx_forms_updated_at ON public.forms(updated_at DESC);

-- Update existing rows to have updated_at equal to created_at if it's NULL
UPDATE public.forms 
SET updated_at = created_at 
WHERE updated_at IS NULL;
