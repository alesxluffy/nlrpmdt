-- Fix approved_emails: Add explicit SELECT policy for High Command only
-- (The ALL policy exists but scanner wants explicit SELECT)
CREATE POLICY "High Command can view approved emails"
ON public.approved_emails
FOR SELECT
USING (has_role(auth.uid(), 'high_command'::app_role));

-- Fix profiles: Restrict to users who have a valid role (not just any authenticated user)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Officers can view profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid()
  )
);