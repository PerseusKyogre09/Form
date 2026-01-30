-- Create the form_responses table
CREATE TABLE IF NOT EXISTS public.form_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL
);

-- Enable RLS
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure a clean state
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.form_responses;
DROP POLICY IF EXISTS "Enable select for form owners" ON public.form_responses;

-- Policies
-- Allow anyone to insert responses (public form filling)
CREATE POLICY "Enable insert for everyone"
  ON public.form_responses FOR INSERT
  WITH CHECK (true);

-- Allow form owners to view responses
CREATE POLICY "Enable select for form owners"
  ON public.form_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.forms f
      WHERE f.id = public.form_responses.form_id
      AND f.user_id = auth.uid()
    )
  );

-- Grant permissions explicitly
GRANT INSERT ON public.form_responses TO anon, authenticated;
GRANT SELECT ON public.form_responses TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
