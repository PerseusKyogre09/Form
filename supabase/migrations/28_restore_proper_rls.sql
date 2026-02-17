-- Restore proper RLS policies for forms and questions
-- Previous policies were too permissive or too restrictive

-- Drop the overly permissive question policies
DROP POLICY IF EXISTS "Users can select all questions (visibility controlled by form access)" ON public.questions;
DROP POLICY IF EXISTS "Users can insert questions via API (access controlled server-side)" ON public.questions;
DROP POLICY IF EXISTS "Users can update questions via API (access controlled server-side)" ON public.questions;
DROP POLICY IF EXISTS "Users can delete questions via API (access controlled server-side)" ON public.questions;

-- Create proper questions policies (only allow form owners to manage)
CREATE POLICY "Users can select questions from their own forms"
  ON public.questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE forms.id = questions.form_id 
      AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert questions into their own forms"
  ON public.questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE forms.id = questions.form_id 
      AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions in their own forms"
  ON public.questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE forms.id = questions.form_id 
      AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions from their own forms"
  ON public.questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE forms.id = questions.form_id 
      AND forms.user_id = auth.uid()
    )
  );

-- Allow public reading of questions from published forms
CREATE POLICY "Anyone can read questions from published forms"
  ON public.questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE forms.id = questions.form_id 
      AND forms.published = true
    )
  );
