-- Créer les types énumérés
CREATE TYPE public.user_role AS ENUM ('ADMIN_PSY', 'PSY', 'PARENT', 'SUPERADMIN_TECH');
CREATE TYPE public.patient_sex AS ENUM ('M', 'F');
CREATE TYPE public.assessment_status AS ENUM ('DRAFT', 'READY_FOR_REVIEW', 'SIGNED', 'SHARED');
CREATE TYPE public.score_direction AS ENUM ('HIGHER_IS_BETTER', 'LOWER_IS_BETTER');
CREATE TYPE public.norm_method AS ENUM ('GAUSSIAN', 'PERCENTILE');
CREATE TYPE public.score_position AS ENUM ('NORMAL', 'A_SURVEILLER', 'EN_DESSOUS');
CREATE TYPE public.document_type AS ENUM ('CR', 'CONSENTEMENT', 'ANNEXE');

-- Table des utilisateurs (profils étendus)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role public.user_role NOT NULL DEFAULT 'PSY',
  phone TEXT,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table des patients
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  sex public.patient_sex NOT NULL,
  school TEXT,
  physician TEXT,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table des représentants légaux
CREATE TABLE public.guardians (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  legal_relation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table de liaison patients-représentants
CREATE TABLE public.patient_guardians (
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (patient_id, guardian_id)
);

-- Table des thèmes principaux
CREATE TABLE public.catalog_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table des sous-thèmes
CREATE TABLE public.catalog_subthemes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  theme_id UUID NOT NULL REFERENCES public.catalog_themes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table des items de test
CREATE TABLE public.catalog_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subtheme_id UUID NOT NULL REFERENCES public.catalog_subthemes(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  unit TEXT,
  direction public.score_direction NOT NULL DEFAULT 'HIGHER_IS_BETTER',
  version TEXT DEFAULT '1.0',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table des gabarits de bilans
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table des items dans les gabarits
CREATE TABLE public.template_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  UNIQUE(template_id, item_id)
);

-- Table des normes
CREATE TABLE public.norms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  method public.norm_method NOT NULL,
  age_min_months INTEGER NOT NULL,
  age_max_months INTEGER NOT NULL,
  mean NUMERIC,
  sd NUMERIC,
  percentiles JSONB,
  version TEXT DEFAULT '1.0',
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table des bilans
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.assessment_status NOT NULL DEFAULT 'DRAFT',
  template_id UUID REFERENCES public.templates(id),
  signed_at TIMESTAMP WITH TIME ZONE,
  version TEXT DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table des résultats de tests
CREATE TABLE public.assessment_item_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.catalog_items(id),
  raw_score NUMERIC NOT NULL,
  standard_score NUMERIC,
  percentile NUMERIC,
  position public.score_position,
  notes TEXT,
  norm_id_used UUID REFERENCES public.norms(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(assessment_id, item_id)
);

-- Table des conclusions par thème
CREATE TABLE public.theme_conclusions (
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES public.catalog_themes(id),
  text TEXT NOT NULL,
  confidence NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (assessment_id, theme_id)
);

-- Table des conclusions générales
CREATE TABLE public.assessment_conclusions (
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE PRIMARY KEY,
  synthesis TEXT NOT NULL,
  recommendations TEXT,
  objectives TEXT,
  llm_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table des consentements
CREATE TABLE public.consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  guardian_id UUID REFERENCES public.guardians(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  given_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Table des logs d'audit
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  meta JSONB DEFAULT '{}',
  ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_subthemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.norms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_item_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_conclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_conclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Fonctions de sécurité pour éviter la récursion RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin_or_psy()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('ADMIN_PSY', 'PSY')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Politiques RLS pour les profils
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Politiques pour les patients (accès ADMIN_PSY et PSY)
CREATE POLICY "PSY can view patients" ON public.patients
  FOR SELECT USING (public.is_admin_or_psy());

CREATE POLICY "PSY can create patients" ON public.patients
  FOR INSERT WITH CHECK (public.is_admin_or_psy() AND created_by_user_id = auth.uid());

CREATE POLICY "ADMIN_PSY can update patients" ON public.patients
  FOR UPDATE USING (public.get_current_user_role() = 'ADMIN_PSY');

CREATE POLICY "ADMIN_PSY can delete patients" ON public.patients
  FOR DELETE USING (public.get_current_user_role() = 'ADMIN_PSY');

-- Politiques pour les bilans
CREATE POLICY "PSY can view assessments" ON public.assessments
  FOR SELECT USING (public.is_admin_or_psy());

CREATE POLICY "PSY can create assessments" ON public.assessments
  FOR INSERT WITH CHECK (public.is_admin_or_psy() AND practitioner_id = auth.uid());

CREATE POLICY "PSY can update their assessments" ON public.assessments
  FOR UPDATE USING (practitioner_id = auth.uid() OR public.get_current_user_role() = 'ADMIN_PSY');

-- Politiques pour le catalogue (lecture pour PSY, écriture pour ADMIN_PSY)
CREATE POLICY "PSY can view catalog themes" ON public.catalog_themes
  FOR SELECT USING (public.is_admin_or_psy());

CREATE POLICY "ADMIN_PSY can manage catalog themes" ON public.catalog_themes
  FOR ALL USING (public.get_current_user_role() = 'ADMIN_PSY');

CREATE POLICY "PSY can view catalog subthemes" ON public.catalog_subthemes
  FOR SELECT USING (public.is_admin_or_psy());

CREATE POLICY "ADMIN_PSY can manage catalog subthemes" ON public.catalog_subthemes
  FOR ALL USING (public.get_current_user_role() = 'ADMIN_PSY');

CREATE POLICY "PSY can view catalog items" ON public.catalog_items
  FOR SELECT USING (public.is_admin_or_psy());

CREATE POLICY "ADMIN_PSY can manage catalog items" ON public.catalog_items
  FOR ALL USING (public.get_current_user_role() = 'ADMIN_PSY');

-- Trigger pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'Utilisateur'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'PSY')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_norms_updated_at
  BEFORE UPDATE ON public.norms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();