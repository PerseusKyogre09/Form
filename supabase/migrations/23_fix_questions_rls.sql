-- Fix RLS policies for questions table to ensure proper access
-- Drop problematic policies and create simpler, more reliable ones

DROP POLICY IF EXISTS "Users can select questions for their own forms" ON public.questions;
DROP POLICY IF EXISTS "Users can insert questions for their own forms" ON public.questions;
DROP POLICY IF EXISTS "Users can update questions for their own forms" ON public.questions;
DROP POLICY IF EXISTS "Users can delete questions from their own forms" ON public.questions;
DROP POLICY IF EXISTS "Anyone can view questions from published forms" ON public.questions;

-- Simple, straightforward policies

-- Authenticated users can see questions for their own forms
CREATE POLICY "Users can select questions from their forms (authenticated)"
  ON public.questions FOR SELECT
  USING (
    form_id IN (
      SELECT id FROM public.forms WHERE user_id = auth.uid()
    )
  );

-- Authenticated users can insert questions for their own forms
CREATE POLICY "Users can insert questions to their forms"
  ON public.questions FOR INSERT
  WITH CHECK (
    form_id IN (
      SELECT id FROM public.forms WHERE user_id = auth.uid()
    )
  );

-- Authenticated users can update questions in their own forms
CREATE POLICY "Users can update questions in their forms"
  ON public.questions FOR UPDATE
  USING (
    form_id IN (
      SELECT id FROM public.forms WHERE user_id = auth.uid()
    )
  );

-- Authenticated users can delete questions from their own forms
CREATE POLICY "Users can delete questions from their forms"
  ON public.questions FOR DELETE
  USING (
    form_id IN (
      SELECT id FROM public.forms WHERE user_id = auth.uid()
    )
  );

-- Anyone (including anon) can read questions from published forms
CREATE POLICY "Anyone can read questions from published forms"
  ON public.questions FOR SELECT
  USING (
    form_id IN (
      SELECT id FROM public.forms WHERE published = true
    )
  );
