-- Ajouter une politique pour permettre l'insertion de profils depuis les edge functions
CREATE POLICY "Service role can insert profiles" 
ON public.profiles 
FOR INSERT 
TO service_role 
WITH CHECK (true);