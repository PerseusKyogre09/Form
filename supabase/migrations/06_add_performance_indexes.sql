-- Add performance indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_forms_user_id ON forms(user_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON form_responses(form_id);