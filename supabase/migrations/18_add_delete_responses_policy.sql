-- Add DELETE policy for form responses
-- Allow form owners to delete responses for their forms

DROP POLICY IF EXISTS "Enable delete for form owners" ON public.form_responses;

CREATE POLICY "Enable delete for form owners"
  ON public.form_responses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.forms f
      WHERE f.id = public.form_responses.form_id
      AND f.user_id = auth.uid()
    )
  );

-- Grant delete permission
GRANT DELETE ON public.form_responses TO authenticated;
