-- Create duty_sessions table for accurate duty tracking
CREATE TABLE IF NOT EXISTS public.duty_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license TEXT NOT NULL,
  officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_hours FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_duty_sessions_license ON public.duty_sessions(license);
CREATE INDEX IF NOT EXISTS idx_duty_sessions_officer_id ON public.duty_sessions(officer_id);
CREATE INDEX IF NOT EXISTS idx_duty_sessions_start_time ON public.duty_sessions(start_time);

-- Add total_hours and duty_status columns to profiles if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_hours FLOAT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS duty_status TEXT DEFAULT 'Off Duty';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_duty_activity TIMESTAMPTZ;

-- Enable RLS on duty_sessions
ALTER TABLE public.duty_sessions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view duty sessions
CREATE POLICY "Authenticated users can view duty sessions"
ON public.duty_sessions
FOR SELECT
TO authenticated
USING (true);

-- Service role can insert/update duty sessions (for edge function)
CREATE POLICY "Service role can manage duty sessions"
ON public.duty_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Enable realtime for duty_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.duty_sessions;