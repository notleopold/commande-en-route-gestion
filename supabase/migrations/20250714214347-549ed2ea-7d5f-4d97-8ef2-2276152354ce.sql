-- Create tables for the order management system

-- Create products table with detailed packaging information
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  dangerous BOOLEAN DEFAULT false,
  unit TEXT NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  suppliers TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  description TEXT,
  
  -- Packaging details - Paquet level
  units_per_package INTEGER,
  package_dimensions_length DECIMAL(8,2), -- cm
  package_dimensions_width DECIMAL(8,2), -- cm  
  package_dimensions_height DECIMAL(8,2), -- cm
  package_weight DECIMAL(8,2), -- kg
  package_volume DECIMAL(10,6), -- m³
  package_material_code TEXT,
  package_signage TEXT,
  
  -- Packaging details - Carton level
  packages_per_carton INTEGER,
  units_per_carton INTEGER,
  carton_dimensions_length DECIMAL(8,2), -- cm
  carton_dimensions_width DECIMAL(8,2), -- cm
  carton_dimensions_height DECIMAL(8,2), -- cm
  carton_weight DECIMAL(8,2), -- kg
  carton_volume DECIMAL(10,6), -- m³
  carton_material_code TEXT,
  carton_signage TEXT,
  
  -- Packaging details - Palette level
  cartons_per_layer INTEGER,
  cartons_per_palette INTEGER,
  layers_per_palette INTEGER,
  palette_dimensions_length DECIMAL(8,2), -- cm
  palette_dimensions_width DECIMAL(8,2), -- cm
  palette_dimensions_height DECIMAL(8,2), -- cm
  palette_weight DECIMAL(8,2), -- kg
  palette_type TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create containers table
CREATE TABLE public.containers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  transitaire TEXT NOT NULL,
  etd DATE,
  eta DATE,
  max_pallets INTEGER DEFAULT 33,
  max_weight DECIMAL(10,2) DEFAULT 28000.00, -- kg
  max_volume DECIMAL(10,2) DEFAULT 76.00, -- m³
  dangerous_goods BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'loading', 'shipped', 'delivered')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  supplier TEXT NOT NULL,
  order_date DATE NOT NULL,
  payment_date DATE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('30% à la commande', '50% à la commande', '100% à la commande')),
  status TEXT NOT NULL CHECK (status IN ('BDC ENVOYÉ ZIKETRO', 'À COMMANDER', 'PAIEMENT EN ATTENTE', 'COMMANDÉ > EN LIVRAISON', 'PAYÉ (30%)', 'PAYÉ (50%)', 'PAYÉ (100%)', 'REÇU TRANSITAIRE SIFA', 'REÇU TRANSITAIRE TAF', 'REÇU TRANSITAIRE CEVA', 'EMBARQUÉ')),
  transitaire_entry TEXT,
  current_transitaire TEXT,
  packaging TEXT,
  weight DECIMAL(10,2),
  volume DECIMAL(10,2),
  cartons INTEGER,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  container_id UUID REFERENCES public.containers(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_products table (junction table for orders and products)
CREATE TABLE public.order_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  palette_quantity INTEGER, -- Number of pallets for this product in this order
  carton_quantity INTEGER, -- Number of cartons for this product in this order
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_products ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now, can be restricted later with authentication)
CREATE POLICY "Allow all operations on products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on containers" ON public.containers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on order_products" ON public.order_products FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_containers_updated_at BEFORE UPDATE ON public.containers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_order_products_updated_at BEFORE UPDATE ON public.order_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.clients (name, email, phone, address) VALUES
('Client A', 'clienta@example.com', '+33123456789', '123 Rue de la Paix, Paris'),
('Client B', 'clientb@example.com', '+33987654321', '456 Avenue des Champs, Lyon'),
('Client C', 'clientc@example.com', '+33555666777', '789 Boulevard Saint-Germain, Marseille');

INSERT INTO public.containers (number, type, transitaire, etd, eta, max_pallets, dangerous_goods) VALUES
('CONT-001', '40HC', 'SIFA', '2024-02-15', '2024-03-15', 33, false),
('CONT-002', '20GP', 'TAF', '2024-02-20', '2024-03-20', 11, false),
('CONT-003', '40HC', 'CEVA', '2024-02-25', '2024-03-25', 33, true);

INSERT INTO public.products (name, category, sku, dangerous, unit, cost, suppliers, description,
  units_per_package, package_dimensions_length, package_dimensions_width, package_dimensions_height,
  package_weight, package_volume, packages_per_carton, units_per_carton,
  carton_dimensions_length, carton_dimensions_width, carton_dimensions_height,
  carton_weight, carton_volume, cartons_per_layer, cartons_per_palette, layers_per_palette,
  palette_dimensions_length, palette_dimensions_width, palette_dimensions_height, palette_weight, palette_type) VALUES
('Papier toilette 3 plis', 'Hygiène', 'SKU-001', false, 'rouleau', 1.25, ARRAY['Lucart'], 'Papier toilette haute qualité',
  50, 10.0, 23.0, 21.5, 0.59, 0.004945, 14, 700,
  24.5, 74.0, 48.0, 8.26, 0.087024, 4, 12, 3,
  120.0, 80.0, 164.0, 123.12, 'E159'),
('Essuie-tout', 'Hygiène', 'SKU-002', false, 'rouleau', 2.50, ARRAY['Lucart'], 'Essuie-tout absorbant',
  24, 12.0, 25.0, 20.0, 0.48, 0.006, 16, 384,
  30.0, 76.0, 45.0, 7.68, 0.1026, 4, 16, 4,
  120.0, 80.0, 180.0, 122.88, 'E159'),
('Produit Chimique X', 'Chimie', 'SKU-003', true, 'litre', 45.50, ARRAY['ChemCorp'], 'Produit chimique industriel',
  1, 15.0, 15.0, 20.0, 1.2, 0.0045, 6, 6,
  32.0, 32.0, 25.0, 7.2, 0.0256, 3, 12, 4,
  120.0, 80.0, 100.0, 86.4, 'E159');