-- Create a function to filter form responses by JSONB answer values
-- This handles numeric question IDs properly
CREATE OR REPLACE FUNCTION filter_form_responses(
  p_form_id UUID,
  p_question_id TEXT,
  p_filter_value TEXT,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  form_id UUID,
  answers JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT fr.id, fr.created_at, fr.form_id, fr.answers
  FROM form_responses fr
  WHERE fr.form_id = p_form_id
    AND (p_question_id IS NULL OR (fr.answers->>p_question_id) ILIKE '%' || p_filter_value || '%')
  ORDER BY fr.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION filter_form_responses TO authenticated, anon;
