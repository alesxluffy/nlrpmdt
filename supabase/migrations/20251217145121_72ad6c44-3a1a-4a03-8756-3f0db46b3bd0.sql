-- Tighten RLS so unauthenticated users cannot read sensitive tables

-- PROFILES: keep same access rules (self OR supervisors), but limit policy to authenticated role
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile or supervisors can view all" ON public.profiles;
CREATE POLICY "Users can view own profile or supervisors can view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (auth.uid() = id)
  OR public.has_role_or_higher(auth.uid(), 'ftd'::public.app_role)
);

-- DUTY LOGS: require authentication to read logs
ALTER TABLE public.duty_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view duty logs" ON public.duty_logs;
CREATE POLICY "Authenticated users can view duty logs"
ON public.duty_logs
FOR SELECT
TO authenticated
USING (true);

-- APPROVED EMAILS: keep High Command-only access, but ensure policy is limited to authenticated role
ALTER TABLE public.approved_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "High Command can view approved emails" ON public.approved_emails;
CREATE POLICY "High Command can view approved emails"
ON public.approved_emails
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'high_command'::public.app_role));

DROP POLICY IF EXISTS "High Command can manage approved emails" ON public.approved_emails;
CREATE POLICY "High Command can manage approved emails"
ON public.approved_emails
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'high_command'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'high_command'::public.app_role));
