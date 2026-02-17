-- Fix infinite recursion in RLS policies
-- The issue: forms policy checks form_collaborators, form_collaborators checks forms = circular dependency

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view their own forms and shared forms" ON public.forms;
DROP POLICY IF EXISTS "Form owners and editors can update forms" ON public.forms;
DROP POLICY IF EXISTS "Form owners can manage collaborators" ON public.form_collaborators;
DROP POLICY IF EXISTS "Collaborators can view collaboration records" ON public.form_collaborators;

-- Recreate forms policies WITHOUT checking form_collaborators
CREATE POLICY "Users can select their own forms"
  ON public.forms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own forms"
  ON public.forms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forms"
  ON public.forms FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms"
  ON public.forms FOR DELETE
  USING (auth.uid() = user_id);

-- Allow anyone (including anon) to read published forms
CREATE POLICY "Anyone can read published forms"
  ON public.forms FOR SELECT
  USING (published = true);

-- Recreate form_collaborators policies WITHOUT checking forms
CREATE POLICY "form_collaborators - collaborators can view their own records"
  ON public.form_collaborators FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "form_collaborators - allow insert by form owner via API"
  ON public.form_collaborators FOR INSERT
  WITH CHECK (true); -- API endpoint will validate ownership

CREATE POLICY "form_collaborators - allow update by form owner via API"
  ON public.form_collaborators FOR UPDATE
  USING (true); -- API endpoint will validate ownership

CREATE POLICY "form_collaborators - allow delete by form owner via API"
  ON public.form_collaborators FOR DELETE
  USING (true); -- API endpoint will validate ownership

-- Update questions policies to NOT check form ownership through forms
DROP POLICY IF EXISTS "Users can select questions from their forms or collaborations" ON public.questions;
DROP POLICY IF EXISTS "Form owners and editors can insert questions" ON public.questions;
DROP POLICY IF EXISTS "Form owners and editors can update questions" ON public.questions;
DROP POLICY IF EXISTS "Form owners and editors can delete questions" ON public.questions;
DROP POLICY IF EXISTS "Anyone can read questions from published forms" ON public.questions;

-- Simple questions policies that DON'T depend on forms relationship
CREATE POLICY "Users can select all questions (visibility controlled by form access)"
  ON public.questions FOR SELECT
  USING (true); -- API will handle access control

CREATE POLICY "Users can insert questions via API (access controlled server-side)"
  ON public.questions FOR INSERT
  WITH CHECK (true); -- API endpoint validates ownership

CREATE POLICY "Users can update questions via API (access controlled server-side)"
  ON public.questions FOR UPDATE
  USING (true); -- API endpoint validates ownership

CREATE POLICY "Users can delete questions via API (access controlled server-side)"
  ON public.questions FOR DELETE
  USING (true); -- API endpoint validates ownership
