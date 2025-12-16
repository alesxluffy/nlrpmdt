-- Drop existing policies that use the old enum
DROP POLICY IF EXISTS "Admins can manage SOP articles" ON public.sop_articles;
DROP POLICY IF EXISTS "Admins can manage SOP categories" ON public.sop_categories;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Manage incident officers" ON public.incident_officers;
DROP POLICY IF EXISTS "Manage incident suspects" ON public.incident_suspects;
DROP POLICY IF EXISTS "Manage incident vehicles" ON public.incident_vehicles;
DROP POLICY IF EXISTS "Officers can update own incidents" ON public.incidents;

-- Drop the has_role function
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Drop the old enum type (need to remove column first)
ALTER TABLE public.user_roles DROP COLUMN IF EXISTS role;

-- Drop old enum
DROP TYPE IF EXISTS public.app_role;

-- Create new enum with 3 roles
CREATE TYPE public.app_role AS ENUM ('patrol', 'ftd', 'high_command');

-- Add role column back
ALTER TABLE public.user_roles ADD COLUMN role public.app_role NOT NULL DEFAULT 'patrol'::public.app_role;

-- Recreate has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user has role at or above a level
CREATE OR REPLACE FUNCTION public.has_role_or_higher(_user_id uuid, _min_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        (_min_role = 'patrol') OR
        (_min_role = 'ftd' AND role IN ('ftd', 'high_command')) OR
        (_min_role = 'high_command' AND role = 'high_command')
      )
  )
$$;

-- Update handle_new_user to assign patrol role by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, badge_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Officer'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Unknown'),
    COALESCE(NEW.raw_user_meta_data->>'badge_number', 'TBD-' || SUBSTRING(NEW.id::TEXT, 1, 8))
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'patrol');
  
  RETURN NEW;
END;
$$;

-- RLS for user_roles: Only High Command can manage
CREATE POLICY "High Command can manage roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'high_command'));

-- RLS for SOP: Only High Command can edit
CREATE POLICY "High Command can manage SOP articles"
ON public.sop_articles
FOR ALL
USING (has_role(auth.uid(), 'high_command'));

CREATE POLICY "High Command can manage SOP categories"
ON public.sop_categories
FOR ALL
USING (has_role(auth.uid(), 'high_command'));

-- RLS for profiles/roster: FTD and High Command can edit others
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update profiles"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id OR 
  has_role_or_higher(auth.uid(), 'ftd')
);

-- RLS for incidents: FTD+ can delete, creator/high_command can update
CREATE POLICY "FTD and High Command can update incidents"
ON public.incidents
FOR UPDATE
USING (
  auth.uid() = created_by OR 
  has_role_or_higher(auth.uid(), 'ftd')
);

CREATE POLICY "FTD and High Command can delete incidents"
ON public.incidents
FOR DELETE
USING (has_role_or_higher(auth.uid(), 'ftd'));

-- RLS for incident related tables
CREATE POLICY "Manage incident officers"
ON public.incident_officers
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM incidents 
    WHERE incidents.id = incident_officers.incident_id 
    AND (incidents.created_by = auth.uid() OR has_role_or_higher(auth.uid(), 'ftd'))
  )
);

CREATE POLICY "Manage incident suspects"
ON public.incident_suspects
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM incidents 
    WHERE incidents.id = incident_suspects.incident_id 
    AND (incidents.created_by = auth.uid() OR has_role_or_higher(auth.uid(), 'ftd'))
  )
);

CREATE POLICY "Manage incident vehicles"
ON public.incident_vehicles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM incidents 
    WHERE incidents.id = incident_vehicles.incident_id 
    AND (incidents.created_by = auth.uid() OR has_role_or_higher(auth.uid(), 'ftd'))
  )
);