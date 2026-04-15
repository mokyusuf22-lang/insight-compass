CREATE OR REPLACE FUNCTION public.get_my_roles()
RETURNS TABLE(role app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid();
$$;