-- Create deleted_items table for trash functionality
CREATE TABLE public.deleted_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  item_id UUID NOT NULL,
  item_data JSONB NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_by UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.deleted_items ENABLE ROW LEVEL SECURITY;

-- Create policies for deleted_items
CREATE POLICY "Only authenticated users can view deleted items" 
ON public.deleted_items 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can insert deleted items" 
ON public.deleted_items 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete expired items" 
ON public.deleted_items 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create function to update timestamps
CREATE TRIGGER update_deleted_items_updated_at
BEFORE UPDATE ON public.deleted_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance on cleanup queries
CREATE INDEX idx_deleted_items_deleted_at ON public.deleted_items(deleted_at);
CREATE INDEX idx_deleted_items_table_name ON public.deleted_items(table_name);

-- Create function to move item to trash
CREATE OR REPLACE FUNCTION public.move_to_trash(
  p_table_name TEXT,
  p_item_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item_data JSONB;
  trash_id UUID;
BEGIN
  -- Get the item data based on table name
  CASE p_table_name
    WHEN 'orders' THEN
      SELECT to_jsonb(orders.*) INTO item_data FROM orders WHERE id = p_item_id;
    WHEN 'suppliers' THEN
      SELECT to_jsonb(suppliers.*) INTO item_data FROM suppliers WHERE id = p_item_id;
    WHEN 'clients' THEN
      SELECT to_jsonb(clients.*) INTO item_data FROM clients WHERE id = p_item_id;
    WHEN 'products' THEN
      SELECT to_jsonb(products.*) INTO item_data FROM products WHERE id = p_item_id;
    ELSE
      RAISE EXCEPTION 'Table % not supported for trash functionality', p_table_name;
  END CASE;

  -- Check if item exists
  IF item_data IS NULL THEN
    RAISE EXCEPTION 'Item with id % not found in table %', p_item_id, p_table_name;
  END IF;

  -- Insert into deleted_items
  INSERT INTO public.deleted_items (table_name, item_id, item_data, deleted_by, reason)
  VALUES (p_table_name, p_item_id, item_data, auth.uid(), p_reason)
  RETURNING id INTO trash_id;

  -- Delete from original table
  CASE p_table_name
    WHEN 'orders' THEN
      DELETE FROM orders WHERE id = p_item_id;
    WHEN 'suppliers' THEN
      DELETE FROM suppliers WHERE id = p_item_id;
    WHEN 'clients' THEN
      DELETE FROM clients WHERE id = p_item_id;
    WHEN 'products' THEN
      DELETE FROM products WHERE id = p_item_id;
  END CASE;

  RETURN trash_id;
END;
$$;

-- Create function to restore item from trash
CREATE OR REPLACE FUNCTION public.restore_from_trash(p_trash_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trash_record RECORD;
  restored BOOLEAN := FALSE;
BEGIN
  -- Get the trash record
  SELECT * INTO trash_record FROM public.deleted_items WHERE id = p_trash_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trash item with id % not found', p_trash_id;
  END IF;

  -- Restore to original table based on table name
  CASE trash_record.table_name
    WHEN 'orders' THEN
      INSERT INTO orders SELECT * FROM jsonb_populate_record(null::orders, trash_record.item_data);
      restored := TRUE;
    WHEN 'suppliers' THEN
      INSERT INTO suppliers SELECT * FROM jsonb_populate_record(null::suppliers, trash_record.item_data);
      restored := TRUE;
    WHEN 'clients' THEN
      INSERT INTO clients SELECT * FROM jsonb_populate_record(null::clients, trash_record.item_data);
      restored := TRUE;
    WHEN 'products' THEN
      INSERT INTO products SELECT * FROM jsonb_populate_record(null::products, trash_record.item_data);
      restored := TRUE;
    ELSE
      RAISE EXCEPTION 'Table % not supported for restore functionality', trash_record.table_name;
  END CASE;

  -- Remove from trash if restoration was successful
  IF restored THEN
    DELETE FROM public.deleted_items WHERE id = p_trash_id;
  END IF;

  RETURN restored;
END;
$$;