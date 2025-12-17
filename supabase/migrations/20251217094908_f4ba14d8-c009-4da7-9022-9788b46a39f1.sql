-- Fix incidents SELECT policy - restrict to users with officer roles only
DROP POLICY IF EXISTS "Officers can view all incidents" ON public.incidents;

CREATE POLICY "Officers with roles can view incidents"
ON public.incidents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
  )
);