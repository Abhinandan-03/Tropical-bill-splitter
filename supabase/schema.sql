-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop existing tables to avoid "already exists" errors
DROP TABLE IF EXISTS public.group_expenses CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.shared_groups CASCADE;
DROP TABLE IF EXISTS public.personal_expenses CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- public.users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- public.personal_expenses table
CREATE TABLE public.personal_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- public.shared_groups table
CREATE TABLE public.shared_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- public.group_members table
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.shared_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- public.group_expenses table
CREATE TABLE public.group_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.shared_groups(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL REFERENCES public.users(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Helper functions to avoid infinite recursion in RLS
CREATE OR REPLACE FUNCTION public.is_group_member(check_group_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = check_group_id AND user_id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_group_creator(check_group_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.shared_groups
    WHERE id = check_group_id AND created_by = auth.uid()
  );
END;
$$;

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and update their own profile" ON public.users FOR ALL USING (auth.uid() = id);

ALTER TABLE public.personal_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their personal expenses" ON public.personal_expenses FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.shared_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view groups they are in or created" ON public.shared_groups FOR SELECT USING (auth.uid() = created_by OR public.is_group_member(id));
CREATE POLICY "Users can insert groups they create" ON public.shared_groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can delete groups they created" ON public.shared_groups FOR DELETE USING (auth.uid() = created_by);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view members of their groups" ON public.group_members FOR SELECT USING (public.is_group_creator(group_id) OR public.is_group_member(group_id));
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.group_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view expenses in their groups" ON public.group_expenses FOR SELECT USING (public.is_group_creator(group_id) OR public.is_group_member(group_id));
CREATE POLICY "Users can add expenses to their groups" ON public.group_expenses FOR INSERT WITH CHECK (auth.uid() = paid_by AND (public.is_group_creator(group_id) OR public.is_group_member(group_id)));

-- Trigger for new user
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name) VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill existing users from auth.users to public.users to prevent foreign key constraints from failing
INSERT INTO public.users (id, email, name)
SELECT id, email, raw_user_meta_data->>'name' FROM auth.users
ON CONFLICT (id) DO NOTHING;
