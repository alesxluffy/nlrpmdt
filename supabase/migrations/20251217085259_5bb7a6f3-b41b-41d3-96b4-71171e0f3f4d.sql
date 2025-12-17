-- Drop the current policy that allows all authenticated users
DROP POLICY IF EXISTS "Authenticated users can view invitation codes" ON public.invitation_codes;

-- Create a new policy that only allows High Command to view invitation codes
CREATE POLICY "High Command can view invitation codes" 
ON public.invitation_codes 
FOR SELECT 
USING (has_role(auth.uid(), 'high_command'::app_role));