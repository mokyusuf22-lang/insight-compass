-- Drop the policy that's throwing the 500
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Confirm what's left
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_roles' AND schemaname = 'public';