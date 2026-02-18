-- Enable collaborator access to forms and responses
-- This migration updates RLS policies to allow collaborators to view forms and responses

-- 1. Update forms policies to allow collaborators to view
DROP POLICY IF EXISTS "Users can select their own forms" ON public.forms;
CREATE POLICY "Users can access their own or shared forms"
  ON public.forms FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.form_collaborators 
      WHERE form_id = public.forms.id 
      AND user_id = auth.uid()
    )
  );

-- 2. Update forms update policy to allow editors
DROP POLICY IF EXISTS "Users can update their own forms" ON public.forms;
CREATE POLICY "Users and editors can update forms"
  ON public.forms FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.form_collaborators 
      WHERE form_id = public.forms.id 
      AND user_id = auth.uid()
      AND role = 'editor'
    )
  );

-- 3. Update form_responses policies
DROP POLICY IF EXISTS "Enable select for form owners" ON public.form_responses;
CREATE POLICY "Enable select for owners and collaborators"
  ON public.form_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.forms f
      WHERE f.id = public.form_responses.form_id
      AND (
        f.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.form_collaborators fc
          WHERE fc.form_id = f.id
          AND fc.user_id = auth.uid()
        )
      )
    )
  );

-- 4. Update form_responses delete policy
DROP POLICY IF EXISTS "Enable delete for form owners" ON public.form_responses;
CREATE POLICY "Enable delete for owners and editors"
  ON public.form_responses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.forms f
      WHERE f.id = public.form_responses.form_id
      AND (
        f.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.form_collaborators fc
          WHERE fc.form_id = f.id
          AND fc.user_id = auth.uid()
          AND role = 'editor'
        )
      )
    )
  );
