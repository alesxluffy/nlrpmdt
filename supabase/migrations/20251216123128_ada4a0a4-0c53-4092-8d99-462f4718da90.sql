-- Create invitation_codes table
CREATE TABLE public.invitation_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

-- High Command can manage invitation codes
CREATE POLICY "High Command can manage invitation codes"
ON public.invitation_codes
FOR ALL
USING (has_role(auth.uid(), 'high_command'::app_role));

-- Anyone can validate codes (needed during signup before auth)
CREATE POLICY "Anyone can validate invitation codes"
ON public.invitation_codes
FOR SELECT
USING (true);

-- Function to validate an invitation code
CREATE OR REPLACE FUNCTION public.validate_invitation_code(code_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_record RECORD;
BEGIN
  SELECT * INTO code_record
  FROM public.invitation_codes
  WHERE code = code_input;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if code has uses remaining
  IF code_record.max_uses IS NOT NULL AND code_record.current_uses >= code_record.max_uses THEN
    RETURN FALSE;
  END IF;
  
  -- Check if code is expired
  IF code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW() THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function to consume an invitation code after successful signup
CREATE OR REPLACE FUNCTION public.use_invitation_code(code_input TEXT, user_id_input UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.invitation_codes
  SET 
    current_uses = current_uses + 1,
    used_by = user_id_input,
    used_at = NOW()
  WHERE code = code_input
    AND (max_uses IS NULL OR current_uses < max_uses)
    AND (expires_at IS NULL OR expires_at > NOW());
  
  RETURN FOUND;
END;
$$;