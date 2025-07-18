-- Fix mutable function search path security warnings
-- Update all functions to use secure search_path setting

-- 1. Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2. Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$function$;

-- 3. Update move_to_trash function
CREATE OR REPLACE FUNCTION public.move_to_trash(p_table_name text, p_item_id uuid, p_reason text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;

-- 4. Update restore_from_trash function
CREATE OR REPLACE FUNCTION public.restore_from_trash(p_trash_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;

-- 5. Update has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- 6. Update get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'moderator' THEN 2
      WHEN 'user' THEN 3
    END
  LIMIT 1
$function$;