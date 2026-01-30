-- Create the forms table
create table forms (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text,
  questions jsonb,
  user_id uuid references auth.users not null
);

-- Enable RLS
alter table forms enable row level security;

-- Policies
create policy "Enable insert for authenticated users only"
  on forms for insert
  with check (auth.uid() = user_id);

create policy "Enable select for users based on user_id"
  on forms for select
  using (auth.uid() = user_id);

create policy "Enable update for users based on user_id"
  on forms for update
  using (auth.uid() = user_id);

create policy "Enable delete for users based on user_id"
  on forms for delete
  using (auth.uid() = user_id);

