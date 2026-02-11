-- Migrate questions from JSONB in forms table to separate questions table
-- This improves public form performance by separating form metadata from questions

-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  data JSONB NOT NULL, -- Store the entire question object as JSONB
  order_index INTEGER NOT NULL DEFAULT 0, -- Position in form
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: questions inherit form's privacy
CREATE POLICY "Users can select questions for their own forms"
  ON public.questions FOR SELECT
  USING (
    form_id IN (
      SELECT id FROM public.forms WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert questions for their own forms"
  ON public.questions FOR INSERT
  WITH CHECK (
    form_id IN (
      SELECT id FROM public.forms WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions for their own forms"
  ON public.questions FOR UPDATE
  USING (
    form_id IN (
      SELECT id FROM public.forms WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions from their own forms"
  ON public.questions FOR DELETE
  USING (
    form_id IN (
      SELECT id FROM public.forms WHERE user_id = auth.uid()
    )
  );

-- Add public select policy for published forms
CREATE POLICY "Anyone can view questions from published forms"
  ON public.questions FOR SELECT
  USING (
    form_id IN (
      SELECT id FROM public.forms WHERE published = true
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_form_id
  ON public.questions(form_id);

CREATE INDEX IF NOT EXISTS idx_questions_form_order
  ON public.questions(form_id, order_index);

-- Migrate existing data from forms.questions to questions table
DO $$
DECLARE
  form_record RECORD;
  question_index INTEGER;
  question JSONB;
BEGIN
  -- Only run migration if questions column exists in forms
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'forms' 
    AND column_name = 'questions'
  ) THEN
    FOR form_record IN SELECT id, questions FROM public.forms WHERE questions IS NOT NULL LOOP
      question_index := 0;
      -- Iterate through questions array
      FOR question IN SELECT jsonb_array_elements(form_record.questions) LOOP
        INSERT INTO public.questions (form_id, data, order_index)
        VALUES (form_record.id, question, question_index)
        ON CONFLICT DO NOTHING;
        question_index := question_index + 1;
      END LOOP;
    END LOOP;
  END IF;
END $$;

-- Drop the old questions column from forms (optional - keep for backward compatibility during testing)
-- Once migration is verified, uncomment:
-- ALTER TABLE public.forms DROP COLUMN questions;
