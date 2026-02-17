-- Create form_collaborators table to track shared form access
CREATE TABLE public.form_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'editor' CHECK (role IN ('viewer', 'editor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure no duplicate collaborators for the same form
  UNIQUE(form_id, user_id)
);

-- Enable RLS
ALTER TABLE public.form_collaborators ENABLE ROW LEVEL SECURITY;

-- Policies for form_collaborators
-- Form owner can view and manage collaborators
CREATE POLICY "Form owners can manage collaborators"
  ON public.form_collaborators
  FOR ALL
  USING (
    form_id IN (
      SELECT id FROM public.forms WHERE user_id = auth.uid()
    )
  );

-- Collaborators can view the collaboration record (optional - for transparency)
CREATE POLICY "Collaborators can view collaboration records"
  ON public.form_collaborators
  FOR SELECT
  USING (user_id = auth.uid());

-- Create an index for faster lookups
CREATE INDEX idx_form_collaborators_form_id ON public.form_collaborators(form_id);
CREATE INDEX idx_form_collaborators_user_id ON public.form_collaborators(user_id);
