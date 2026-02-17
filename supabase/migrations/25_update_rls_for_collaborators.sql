-- Update RLS policies to allow collaborators to view and edit forms and questions

-- Update questions policies to allow collaborators
DROP POLICY IF EXISTS "Users can select questions from their forms (authenticated)" ON public.questions;
CREATE POLICY "Users can select questions from their forms or collaborations"
  ON public.questions FOR SELECT
  USING (
    form_id IN (
      SELECT id FROM public.forms WHERE user_id = auth.uid()
      UNION
      SELECT form_id FROM public.form_collaborators WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert questions to their forms" ON public.questions;
CREATE POLICY "Form owners and editors can insert questions"
  ON public.questions FOR INSERT
  WITH CHECK (
    form_id IN (
      SELECT id FROM public.forms WHERE user_id = auth.uid()
      UNION
      SELECT form_id FROM public.form_collaborators 
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

DROP POLICY IF EXISTS "Users can update questions in their forms" ON public.questions;
CREATE POLICY "Form owners and editors can update questions"
  ON public.questions FOR UPDATE
  USING (
    form_id IN (
      SELECT id FROM public.forms WHERE user_id = auth.uid()
      UNION
      SELECT form_id FROM public.form_collaborators 
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

DROP POLICY IF EXISTS "Users can delete questions from their forms" ON public.questions;
CREATE POLICY "Form owners and editors can delete questions"
  ON public.questions FOR DELETE
  USING (
    form_id IN (
      SELECT id FROM public.forms WHERE user_id = auth.uid()
      UNION
      SELECT form_id FROM public.form_collaborators 
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

-- Update forms policies to allow collaborators to view
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON public.forms;
CREATE POLICY "Users can view their own forms and shared forms"
  ON public.forms FOR SELECT
  USING (
    auth.uid() = user_id
    OR id IN (
      SELECT form_id FROM public.form_collaborators WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.forms;
CREATE POLICY "Form owners and editors can update forms"
  ON public.forms FOR UPDATE
  USING (
    auth.uid() = user_id
    OR id IN (
      SELECT form_id FROM public.form_collaborators 
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );
