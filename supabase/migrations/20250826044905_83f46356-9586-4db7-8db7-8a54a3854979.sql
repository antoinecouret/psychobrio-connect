-- Add configuration fields to catalog_items table to define which input fields are available
ALTER TABLE public.catalog_items 
ADD COLUMN has_raw_score BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN has_percentile BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN has_standard_score BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN has_notes BOOLEAN NOT NULL DEFAULT true;