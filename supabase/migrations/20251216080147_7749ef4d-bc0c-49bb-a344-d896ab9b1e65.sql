-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'officer');

-- Create profiles table for officers
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_number TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  rank TEXT DEFAULT 'Cadet',
  division TEXT DEFAULT 'Patrol',
  status TEXT DEFAULT 'Active',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'officer',
  UNIQUE (user_id, role)
);

-- Create SOP categories table
CREATE TABLE public.sop_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create SOP articles table
CREATE TABLE public.sop_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.sop_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create incidents table
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type TEXT NOT NULL,
  location TEXT NOT NULL,
  custom_location TEXT,
  description TEXT,
  pursuit_occurred BOOLEAN DEFAULT FALSE,
  pursuit_initiator TEXT,
  pursuit_reason TEXT,
  pursuit_type TEXT,
  pursuit_termination TEXT,
  notes TEXT,
  report_content TEXT,
  status TEXT DEFAULT 'Open',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create incident_officers junction table
CREATE TABLE public.incident_officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE,
  officer_name TEXT NOT NULL,
  role TEXT DEFAULT 'Responding'
);

-- Create incident_suspects table
CREATE TABLE public.incident_suspects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  charges TEXT,
  status TEXT DEFAULT 'At Large'
);

-- Create incident_vehicles table
CREATE TABLE public.incident_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE,
  vehicle_name TEXT NOT NULL,
  plate TEXT,
  color TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_suspects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_vehicles ENABLE ROW LEVEL SECURITY;

-- Create has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, badge_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Officer'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Unknown'),
    COALESCE(NEW.raw_user_meta_data->>'badge_number', 'TBD-' || SUBSTRING(NEW.id::TEXT, 1, 8))
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'officer');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for SOP
CREATE POLICY "Anyone can view SOPs" ON public.sop_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage SOP categories" ON public.sop_categories
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view SOP articles" ON public.sop_articles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage SOP articles" ON public.sop_articles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for incidents
CREATE POLICY "Officers can view all incidents" ON public.incidents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Officers can create incidents" ON public.incidents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Officers can update own incidents" ON public.incidents
  FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- RLS for incident related tables
CREATE POLICY "View incident officers" ON public.incident_officers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Manage incident officers" ON public.incident_officers
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.incidents WHERE id = incident_id AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );

CREATE POLICY "View incident suspects" ON public.incident_suspects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Manage incident suspects" ON public.incident_suspects
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.incidents WHERE id = incident_id AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );

CREATE POLICY "View incident vehicles" ON public.incident_vehicles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Manage incident vehicles" ON public.incident_vehicles
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.incidents WHERE id = incident_id AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );

-- Insert default SOP categories
INSERT INTO public.sop_categories (name, description, sort_order) VALUES
  ('General Procedures', 'Basic operational guidelines for all officers', 1),
  ('Patrol Operations', 'Guidelines for patrol duties and traffic enforcement', 2),
  ('Pursuit Policy', 'Vehicle pursuit guidelines and protocols', 3),
  ('Use of Force', 'Force continuum and engagement protocols', 4),
  ('Arrest Procedures', 'Proper arrest and detention procedures', 5),
  ('Radio Communications', '10-codes and radio etiquette', 6);