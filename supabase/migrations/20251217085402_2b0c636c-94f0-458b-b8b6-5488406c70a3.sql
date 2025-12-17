-- Fix profiles table: require authentication to view
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix approved_emails table: restrict to High Command only
DROP POLICY IF EXISTS "Authenticated users can check approved emails" ON public.approved_emails;