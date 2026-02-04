-- Create GIN index on answers column for faster JSON filtering
CREATE INDEX IF NOT EXISTS idx_form_responses_answers ON public.form_responses USING gin (answers);
