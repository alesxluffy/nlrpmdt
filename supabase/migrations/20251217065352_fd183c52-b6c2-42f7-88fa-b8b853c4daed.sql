-- Create approved_emails table to replace invitation codes
CREATE TABLE public.approved_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID
);

-- Enable RLS
ALTER TABLE public.approved_emails ENABLE ROW LEVEL SECURITY;

-- Anyone can check if email is approved (for registration)
CREATE POLICY "Anyone can check approved emails"
ON public.approved_emails
FOR SELECT
USING (true);

-- Only High Command can manage approved emails
CREATE POLICY "High Command can manage approved emails"
ON public.approved_emails
FOR ALL
USING (has_role(auth.uid(), 'high_command'));

-- Function to validate if email is approved
CREATE OR REPLACE FUNCTION public.validate_email_access(email_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_record RECORD;
BEGIN
  SELECT * INTO email_record
  FROM public.approved_emails
  WHERE LOWER(email) = LOWER(email_input);
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if already used
  IF email_record.used_by IS NOT NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function to mark email as used
CREATE OR REPLACE FUNCTION public.use_approved_email(email_input TEXT, user_id_input UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.approved_emails
  SET 
    used_by = user_id_input,
    used_at = NOW()
  WHERE LOWER(email) = LOWER(email_input)
    AND used_by IS NULL;
  
  RETURN FOUND;
END;
$$;