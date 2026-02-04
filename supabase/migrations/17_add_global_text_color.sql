-- Add global_text_color column to forms table
ALTER TABLE forms ADD COLUMN IF NOT EXISTS global_text_color TEXT;
