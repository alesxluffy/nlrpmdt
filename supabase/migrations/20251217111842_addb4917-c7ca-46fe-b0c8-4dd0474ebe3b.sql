-- Create duty_logs table to store on/off duty events
CREATE TABLE public.duty_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id text NOT NULL,
    status text NOT NULL CHECK (status IN ('on_duty', 'off_duty')),
    rank_at_time text,
    raw_message text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.duty_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view duty logs
CREATE POLICY "Authenticated users can view duty logs"
ON public.duty_logs
FOR SELECT
TO authenticated
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_duty_logs_license_id ON public.duty_logs(license_id);
CREATE INDEX idx_duty_logs_created_at ON public.duty_logs(created_at DESC);