-- Create an enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create a function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'moderator' THEN 2
      WHEN 'user' THEN 3
    END
  LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update deleted_items policies to restrict to admins only
DROP POLICY IF EXISTS "Only authenticated users can view deleted items" ON public.deleted_items;
DROP POLICY IF EXISTS "Only authenticated users can insert deleted items" ON public.deleted_items;
DROP POLICY IF EXISTS "Only authenticated users can delete expired items" ON public.deleted_items;

CREATE POLICY "Only admins can view deleted items"
ON public.deleted_items
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can restore deleted items"
ON public.deleted_items
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can permanently delete items"
ON public.deleted_items
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can move items to trash"
ON public.deleted_items
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Insert default admin role (replace with actual user ID when known)
-- This is just an example - you'll need to update with real user IDs
-- INSERT INTO public.user_roles (user_id, role) VALUES ('REPLACE_WITH_ADMIN_USER_ID', 'admin');