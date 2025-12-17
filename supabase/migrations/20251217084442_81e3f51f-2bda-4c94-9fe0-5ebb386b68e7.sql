-- Add vehicle image columns
ALTER TABLE public.incident_vehicles 
ADD COLUMN IF NOT EXISTS front_image text,
ADD COLUMN IF NOT EXISTS back_image text,
ADD COLUMN IF NOT EXISTS plate_image text,
ADD COLUMN IF NOT EXISTS registered_owner text;

-- Update incidents RLS policy to allow all authenticated users to edit
DROP POLICY IF EXISTS "FTD and High Command can update incidents" ON public.incidents;

CREATE POLICY "Authenticated users can update incidents" 
ON public.incidents 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Add delete policy for profiles (FTD and High Command only)
CREATE POLICY "FTD and High Command can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (has_role_or_higher(auth.uid(), 'ftd'::app_role));