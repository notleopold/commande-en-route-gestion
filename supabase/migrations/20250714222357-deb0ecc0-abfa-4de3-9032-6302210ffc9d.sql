-- Extend existing clients table with new fields
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'External',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active',
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS time_zone TEXT,
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'French',
ADD COLUMN IF NOT EXISTS main_contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_role TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS secondary_contact TEXT,
ADD COLUMN IF NOT EXISTS communication_preferences TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS documents TEXT[],
ADD COLUMN IF NOT EXISTS pricing_terms TEXT,
ADD COLUMN IF NOT EXISTS payment_conditions TEXT,
ADD COLUMN IF NOT EXISTS preferred_transporters TEXT;

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id TEXT, -- Manual or auto payment reference
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'EUR',
  payment_method TEXT, -- Bank Transfer, Cash, Mobile Money, Other
  payment_status TEXT DEFAULT 'Pending', -- Confirmed, Pending
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY "Allow all operations on payments" 
ON public.payments 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for payments timestamp updates
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_clients_type ON public.clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_country ON public.clients(country);