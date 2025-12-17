-- Fix 1: profiles table - restrict SELECT to own profile or supervisory roles
DROP POLICY IF EXISTS "Officers can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile or supervisors can view all"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR has_role_or_higher(auth.uid(), 'ftd'::app_role)
);

-- Fix 2: incident_suspects - restrict SELECT to involved officers or supervisory roles
DROP POLICY IF EXISTS "View incident suspects" ON public.incident_suspects;

CREATE POLICY "Officers can view incident suspects they are involved in or supervisors"
ON public.incident_suspects
FOR SELECT
USING (
  has_role_or_higher(auth.uid(), 'ftd'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.incidents i
    WHERE i.id = incident_suspects.incident_id
    AND i.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.incident_officers io
    JOIN public.profiles p ON p.first_name || ' ' || p.last_name = io.officer_name
    WHERE io.incident_id = incident_suspects.incident_id
    AND p.id = auth.uid()
  )
);

-- Fix 3: incidents UPDATE - restrict to creator or supervisory roles
DROP POLICY IF EXISTS "Authenticated users can update incidents" ON public.incidents;

CREATE POLICY "Creators and supervisors can update incidents"
ON public.incidents
FOR UPDATE
USING (
  auth.uid() = created_by
  OR has_role_or_higher(auth.uid(), 'ftd'::app_role)
);

-- Also fix incident_vehicles SELECT policy for consistency
DROP POLICY IF EXISTS "View incident vehicles" ON public.incident_vehicles;

CREATE POLICY "Officers can view incident vehicles they are involved in or supervisors"
ON public.incident_vehicles
FOR SELECT
USING (
  has_role_or_higher(auth.uid(), 'ftd'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.incidents i
    WHERE i.id = incident_vehicles.incident_id
    AND i.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.incident_officers io
    JOIN public.profiles p ON p.first_name || ' ' || p.last_name = io.officer_name
    WHERE io.incident_id = incident_vehicles.incident_id
    AND p.id = auth.uid()
  )
);

-- Also fix incident_officers SELECT policy for consistency
DROP POLICY IF EXISTS "View incident officers" ON public.incident_officers;

CREATE POLICY "Officers can view incident officers they are involved in or supervisors"
ON public.incident_officers
FOR SELECT
USING (
  has_role_or_higher(auth.uid(), 'ftd'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.incidents i
    WHERE i.id = incident_officers.incident_id
    AND i.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.incident_officers io
    JOIN public.profiles p ON p.first_name || ' ' || p.last_name = io.officer_name
    WHERE io.incident_id = incident_officers.incident_id
    AND p.id = auth.uid()
  )
);