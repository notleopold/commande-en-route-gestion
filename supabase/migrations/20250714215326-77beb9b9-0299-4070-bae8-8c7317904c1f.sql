-- Create tables for missing menus: Groupage, Users, Reports, Settings

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'manager')),
  department TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create groupages table (shared container space managed by transitaire)
CREATE TABLE public.groupages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  container_id UUID NOT NULL REFERENCES public.containers(id),
  transitaire TEXT NOT NULL,
  available_space_pallets INTEGER NOT NULL DEFAULT 0,
  max_space_pallets INTEGER NOT NULL DEFAULT 33,
  available_weight DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- kg
  max_weight DECIMAL(10,2) NOT NULL DEFAULT 28000.00, -- kg
  available_volume DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- m³
  max_volume DECIMAL(10,2) NOT NULL DEFAULT 76.00, -- m³
  allows_dangerous_goods BOOLEAN DEFAULT false,
  cost_per_palette DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- Cost per palette
  cost_per_kg DECIMAL(10,2) DEFAULT 0.00, -- Additional cost per kg
  cost_per_m3 DECIMAL(10,2) DEFAULT 0.00, -- Additional cost per m³
  departure_date DATE,
  arrival_date DATE,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'full', 'departed', 'arrived')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create groupage_bookings table (orders booked in groupage)
CREATE TABLE public.groupage_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  groupage_id UUID NOT NULL REFERENCES public.groupages(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  palettes_booked INTEGER NOT NULL DEFAULT 0,
  weight_booked DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- kg
  volume_booked DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- m³
  cost_calculated DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- Total cost for this booking
  has_dangerous_goods BOOLEAN DEFAULT false,
  booking_status TEXT DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled')),
  booking_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  confirmed_by_transitaire BOOLEAN DEFAULT false,
  transitaire_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(groupage_id, order_id)
);

-- Create reports table for storing generated reports
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('orders', 'containers', 'groupage', 'financial', 'custom')),
  parameters JSONB, -- Store report filters and parameters
  generated_by UUID REFERENCES public.profiles(id),
  file_url TEXT, -- URL to stored report file if needed
  status TEXT DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create settings table for application configuration
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'email', 'notifications', 'integrations', 'security')),
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groupages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groupage_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow all operations on groupages" ON public.groupages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on groupage_bookings" ON public.groupage_bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on reports" ON public.reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_groupages_updated_at BEFORE UPDATE ON public.groupages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_groupage_bookings_updated_at BEFORE UPDATE ON public.groupage_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample groupage data
INSERT INTO public.groupages (container_id, transitaire, available_space_pallets, max_space_pallets, available_weight, max_weight, available_volume, max_volume, allows_dangerous_goods, cost_per_palette, departure_date, arrival_date) 
SELECT 
  id, 
  transitaire,
  max_pallets - 10, -- 10 palettes already booked
  max_pallets,
  max_weight - 5000, -- 5 tonnes already booked
  max_weight,
  max_volume - 15, -- 15m³ already booked
  max_volume,
  dangerous_goods,
  CASE 
    WHEN transitaire = 'SIFA' THEN 150.00
    WHEN transitaire = 'TAF' THEN 140.00
    WHEN transitaire = 'CEVA' THEN 160.00
    ELSE 150.00
  END,
  etd,
  eta
FROM public.containers;

-- Insert sample app settings
INSERT INTO public.app_settings (setting_key, setting_value, description, category) VALUES
('company_name', '"LogiFlow Pro"', 'Nom de l entreprise', 'general'),
('default_currency', '"EUR"', 'Devise par défaut', 'general'),
('email_notifications', 'true', 'Activer les notifications email', 'notifications'),
('max_palettes_per_order', '50', 'Nombre maximum de palettes par commande', 'general'),
('transitaire_contact_sifa', '{"email": "contact@sifa.fr", "phone": "+33123456789"}', 'Contact SIFA', 'integrations'),
('transitaire_contact_taf', '{"email": "contact@taf.fr", "phone": "+33987654321"}', 'Contact TAF', 'integrations'),
('transitaire_contact_ceva', '{"email": "contact@ceva.fr", "phone": "+33555666777"}', 'Contact CEVA', 'integrations');