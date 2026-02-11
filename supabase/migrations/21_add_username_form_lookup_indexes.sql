-- Add indexes for fast username and form lookups
-- These are critical for the /form/{username}/{slug} public route
-- Without these, even small tables require full table scans

-- Fast lookup by username in profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username
ON profiles (username);

-- Fast lookup by user_id and slug in forms
CREATE INDEX IF NOT EXISTS idx_forms_user_slug
ON forms (user_id, slug);
