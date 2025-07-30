-- Temporairement supprimer le trigger qui cause le conflit
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Aussi supprimer la fonction qui ne fonctionne pas correctement avec les enums
DROP FUNCTION IF EXISTS public.handle_new_user();