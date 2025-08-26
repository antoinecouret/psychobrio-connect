
-- Add foreign key constraint with CASCADE DELETE for assessment_item_results -> catalog_items
ALTER TABLE public.assessment_item_results 
DROP CONSTRAINT IF EXISTS assessment_item_results_item_id_fkey;

ALTER TABLE public.assessment_item_results 
ADD CONSTRAINT assessment_item_results_item_id_fkey 
FOREIGN KEY (item_id) REFERENCES public.catalog_items(id) ON DELETE CASCADE;
