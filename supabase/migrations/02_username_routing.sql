-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  username TEXT UNIQUE
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create profiles RLS policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Add username column if it doesn't exist (for existing profiles tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'username'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;
  END IF;
END $$;

-- Add slug column to forms table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'forms' 
    AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.forms ADD COLUMN slug TEXT;
  END IF;
END $$;

-- Add unique constraint on user_id + slug combination
DROP INDEX IF EXISTS forms_user_slug_idx;
CREATE UNIQUE INDEX forms_user_slug_idx ON public.forms(user_id, slug);

-- Drop existing forms RLS policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.forms;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON public.forms;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.forms;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.forms;
DROP POLICY IF EXISTS "Enable public read" ON public.forms;
DROP POLICY IF EXISTS "Public can view forms by slug" ON public.forms;

-- Create new forms RLS policies
CREATE POLICY "Enable insert for authenticated users only"
  ON public.forms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own forms
CREATE POLICY "Enable select for users based on user_id"
  ON public.forms FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update their own forms
CREATE POLICY "Enable update for users based on user_id"
  ON public.forms FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own forms
CREATE POLICY "Enable delete for users based on user_id"
  ON public.forms FOR DELETE
  USING (auth.uid() = user_id);

-- Allow ANYONE (including anonymous users) to read forms
CREATE POLICY "Public can view forms by slug"
  ON public.forms FOR SELECT
  USING (true);

-- Create or replace function to get form by username and slug
CREATE OR REPLACE FUNCTION public.get_form_by_username_slug(p_username TEXT, p_slug TEXT)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  title TEXT,
  questions JSONB,
  user_id UUID,
  slug TEXT
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.created_at,
    f.title,
    f.questions,
    f.user_id,
    f.slug
  FROM public.forms f
  INNER JOIN public.profiles p ON f.user_id = p.id
  WHERE p.username = p_username AND f.slug = p_slug;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create profiles for existing users who don't have one
INSERT INTO public.profiles (id)
SELECT u.id
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.forms TO authenticated;
GRANT SELECT ON public.forms TO anon;
GRANT EXECUTE ON FUNCTION public.get_form_by_username_slug TO anon, authenticated;
