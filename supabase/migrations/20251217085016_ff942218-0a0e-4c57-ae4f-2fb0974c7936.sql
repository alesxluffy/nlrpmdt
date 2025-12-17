-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can check approved emails" ON public.approved_emails;

-- Create a new policy that requires authentication
CREATE POLICY "Authenticated users can check approved emails" 
ON public.approved_emails 
FOR SELECT 
USING (auth.uid() IS NOT NULL);