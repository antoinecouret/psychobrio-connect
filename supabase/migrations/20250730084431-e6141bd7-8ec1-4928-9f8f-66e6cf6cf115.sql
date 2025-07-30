-- Créer les politiques RLS pour assessment_item_results
CREATE POLICY "PSY can view assessment item results" 
ON public.assessment_item_results 
FOR SELECT 
USING (is_admin_or_psy());

CREATE POLICY "PSY can manage assessment item results" 
ON public.assessment_item_results 
FOR ALL 
USING (is_admin_or_psy())
WITH CHECK (is_admin_or_psy());

-- Activer RLS sur la table
ALTER TABLE public.assessment_item_results ENABLE ROW LEVEL SECURITY;