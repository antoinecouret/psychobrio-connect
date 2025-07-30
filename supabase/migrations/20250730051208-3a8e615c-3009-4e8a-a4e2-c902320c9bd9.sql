-- Créer un utilisateur administrateur par défaut
-- Note: Ceci est pour le développement initial. En production, utilisez l'interface d'administration.

-- Insérer un profil administrateur avec un ID fixe pour le développement
INSERT INTO public.profiles (id, name, email, role) 
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Administrateur Système',
  'admin@psychobrio.com',
  'ADMIN_PSY'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- Mettre à jour la fonction handle_new_user pour s'assurer qu'elle fonctionne correctement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'PSY')
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$;

-- Créer ou recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();