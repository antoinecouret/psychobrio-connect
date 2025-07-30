-- Créer la table pour les conclusions par thème
CREATE TABLE IF NOT EXISTS public.theme_conclusions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL,
  theme_id UUID NOT NULL,
  text TEXT NOT NULL,
  confidence NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table pour les conclusions générales
CREATE TABLE IF NOT EXISTS public.assessment_conclusions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL UNIQUE,
  synthesis TEXT NOT NULL,
  objectives TEXT,
  recommendations TEXT,
  llm_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur les tables
ALTER TABLE public.theme_conclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_conclusions ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour theme_conclusions
CREATE POLICY "PSY can view theme conclusions" 
ON public.theme_conclusions 
FOR SELECT 
USING (is_admin_or_psy());

CREATE POLICY "PSY can manage theme conclusions" 
ON public.theme_conclusions 
FOR ALL 
USING (is_admin_or_psy())
WITH CHECK (is_admin_or_psy());

-- Créer les politiques RLS pour assessment_conclusions
CREATE POLICY "PSY can view assessment conclusions" 
ON public.assessment_conclusions 
FOR SELECT 
USING (is_admin_or_psy());

CREATE POLICY "PSY can manage assessment conclusions" 
ON public.assessment_conclusions 
FOR ALL 
USING (is_admin_or_psy())
WITH CHECK (is_admin_or_psy());

-- Ajouter des index pour améliorer les performances
CREATE INDEX idx_theme_conclusions_assessment_id ON public.theme_conclusions(assessment_id);
CREATE INDEX idx_theme_conclusions_theme_id ON public.theme_conclusions(theme_id);
CREATE INDEX idx_assessment_conclusions_assessment_id ON public.assessment_conclusions(assessment_id);