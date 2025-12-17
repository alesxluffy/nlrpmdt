-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can validate invitation codes" ON public.invitation_codes;

-- Create a new policy that requires authentication
CREATE POLICY "Authenticated users can view invitation codes" 
ON public.invitation_codes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);