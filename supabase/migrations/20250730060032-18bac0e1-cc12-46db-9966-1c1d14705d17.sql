-- Ajouter les contraintes de clés étrangères manquantes
ALTER TABLE catalog_items 
ADD CONSTRAINT fk_catalog_items_subtheme 
FOREIGN KEY (subtheme_id) REFERENCES catalog_subthemes(id) ON DELETE CASCADE;

ALTER TABLE catalog_subthemes 
ADD CONSTRAINT fk_catalog_subthemes_theme 
FOREIGN KEY (theme_id) REFERENCES catalog_themes(id) ON DELETE CASCADE;