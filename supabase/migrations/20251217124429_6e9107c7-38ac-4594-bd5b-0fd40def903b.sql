-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Officers can view incident officers they are involved in or sup" ON public.incident_officers;
DROP POLICY IF EXISTS "Officers can view incident suspects they are involved in or sup" ON public.incident_suspects;
DROP POLICY IF EXISTS "Officers can view incident vehicles they are involved in or sup" ON public.incident_vehicles;

-- Create simpler SELECT policies that don't self-reference
-- Officers can view incident_officers if they have a role (same as incidents table)
CREATE POLICY "Officers can view incident officers" 
ON public.incident_officers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid()
  )
);

-- Officers can view incident_suspects if they have a role
CREATE POLICY "Officers can view incident suspects" 
ON public.incident_suspects 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid()
  )
);

-- Officers can view incident_vehicles if they have a role
CREATE POLICY "Officers can view incident vehicles" 
ON public.incident_vehicles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid()
  )
);