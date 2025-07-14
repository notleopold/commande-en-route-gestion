-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- General Information
  name TEXT NOT NULL,
  country TEXT,
  address TEXT,
  product_types TEXT[], -- Array of product categories
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive, under_testing
  exclusive_to_client BOOLEAN DEFAULT false,
  associated_clients UUID[], -- Array of client IDs when exclusive
  
  -- Contact Information
  main_contact_name TEXT,
  position TEXT,
  email TEXT,
  phone TEXT,
  preferred_communication TEXT, -- Email, WhatsApp, Phone, Other
  
  -- Commercial Terms
  payment_method TEXT,
  payment_conditions TEXT,
  incoterm TEXT, -- EXW, FOB, CIF, DDP
  currency TEXT,
  preparation_time INTEGER, -- in days
  minimum_order_amount NUMERIC,
  minimum_order_quantity INTEGER,
  
  -- Logistics & Shipping
  shipping_origin TEXT,
  ships_themselves BOOLEAN DEFAULT false,
  transport_partners TEXT,
  packaging_specs TEXT,
  
  -- Supplier Metrics
  total_orders INTEGER DEFAULT 0,
  delivery_rate NUMERIC DEFAULT 0, -- percentage
  incidents_count INTEGER DEFAULT 0,
  reliability_rating INTEGER, -- 1-5 scale
  last_order_date DATE,
  
  -- Notes & Attachments
  notes TEXT,
  attachments TEXT[], -- URLs or file paths
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies for suppliers
CREATE POLICY "Allow all operations on suppliers" 
ON public.suppliers 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_suppliers_name ON public.suppliers(name);
CREATE INDEX idx_suppliers_status ON public.suppliers(status);
CREATE INDEX idx_suppliers_country ON public.suppliers(country);
CREATE INDEX idx_suppliers_exclusive ON public.suppliers(exclusive_to_client);