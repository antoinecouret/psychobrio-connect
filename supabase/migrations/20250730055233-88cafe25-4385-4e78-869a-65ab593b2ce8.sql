-- Créer des thèmes de base pour le catalogue
INSERT INTO catalog_themes (name, order_index) VALUES 
('Motricité globale', 1),
('Motricité fine', 2),
('Coordination', 3),
('Équilibre', 4),
('Latéralité', 5)
ON CONFLICT DO NOTHING;

-- Créer des sous-thèmes
INSERT INTO catalog_subthemes (theme_id, name, order_index) VALUES 
((SELECT id FROM catalog_themes WHERE name = 'Motricité globale' LIMIT 1), 'Locomotion', 1),
((SELECT id FROM catalog_themes WHERE name = 'Motricité globale' LIMIT 1), 'Saut', 2),
((SELECT id FROM catalog_themes WHERE name = 'Motricité fine' LIMIT 1), 'Préhension', 1),
((SELECT id FROM catalog_themes WHERE name = 'Motricité fine' LIMIT 1), 'Graphisme', 2),
((SELECT id FROM catalog_themes WHERE name = 'Coordination' LIMIT 1), 'Coordination oculo-manuelle', 1),
((SELECT id FROM catalog_themes WHERE name = 'Équilibre' LIMIT 1), 'Équilibre statique', 1),
((SELECT id FROM catalog_themes WHERE name = 'Équilibre' LIMIT 1), 'Équilibre dynamique', 2),
((SELECT id FROM catalog_themes WHERE name = 'Latéralité' LIMIT 1), 'Latéralité manuelle', 1)
ON CONFLICT DO NOTHING;

-- Créer des items de catalogue
INSERT INTO catalog_items (subtheme_id, name, code, description, unit, direction) VALUES 
-- Motricité globale - Locomotion
((SELECT id FROM catalog_subthemes WHERE name = 'Locomotion' LIMIT 1), 'Course 20 mètres', 'MG_LOC_001', 'Temps de course sur 20 mètres', 'secondes', 'LOWER_IS_BETTER'),
((SELECT id FROM catalog_subthemes WHERE name = 'Locomotion' LIMIT 1), 'Marche sur ligne', 'MG_LOC_002', 'Nombre de pas corrects sur 10 pas', 'pas', 'HIGHER_IS_BETTER'),

-- Motricité globale - Saut
((SELECT id FROM catalog_subthemes WHERE name = 'Saut' LIMIT 1), 'Saut en longueur', 'MG_SAU_001', 'Distance du saut en longueur', 'centimètres', 'HIGHER_IS_BETTER'),
((SELECT id FROM catalog_subthemes WHERE name = 'Saut' LIMIT 1), 'Saut à cloche-pied', 'MG_SAU_002', 'Nombre de sauts consécutifs sur un pied', 'sauts', 'HIGHER_IS_BETTER'),

-- Motricité fine - Préhension
((SELECT id FROM catalog_subthemes WHERE name = 'Préhension' LIMIT 1), 'Pince pouce-index', 'MF_PRE_001', 'Capacité à saisir un objet avec la pince pouce-index', 'score', 'HIGHER_IS_BETTER'),
((SELECT id FROM catalog_subthemes WHERE name = 'Préhension' LIMIT 1), 'Force de préhension', 'MF_PRE_002', 'Force mesurée au dynamomètre', 'kg', 'HIGHER_IS_BETTER'),

-- Motricité fine - Graphisme
((SELECT id FROM catalog_subthemes WHERE name = 'Graphisme' LIMIT 1), 'Copie de formes', 'MF_GRA_001', 'Score de qualité des formes copiées', 'score/10', 'HIGHER_IS_BETTER'),
((SELECT id FROM catalog_subthemes WHERE name = 'Graphisme' LIMIT 1), 'Vitesse d''écriture', 'MF_GRA_002', 'Nombre de lettres écrites en 1 minute', 'lettres/min', 'HIGHER_IS_BETTER'),

-- Coordination
((SELECT id FROM catalog_subthemes WHERE name = 'Coordination oculo-manuelle' LIMIT 1), 'Lancer de précision', 'COORD_001', 'Nombre de cibles atteintes sur 10 lancers', 'cibles/10', 'HIGHER_IS_BETTER'),
((SELECT id FROM catalog_subthemes WHERE name = 'Coordination oculo-manuelle' LIMIT 1), 'Enfiler des perles', 'COORD_002', 'Temps pour enfiler 10 perles', 'secondes', 'LOWER_IS_BETTER'),

-- Équilibre statique
((SELECT id FROM catalog_subthemes WHERE name = 'Équilibre statique' LIMIT 1), 'Équilibre unipodal', 'EQ_STA_001', 'Temps tenu sur un pied, yeux ouverts', 'secondes', 'HIGHER_IS_BETTER'),
((SELECT id FROM catalog_subthemes WHERE name = 'Équilibre statique' LIMIT 1), 'Équilibre unipodal yeux fermés', 'EQ_STA_002', 'Temps tenu sur un pied, yeux fermés', 'secondes', 'HIGHER_IS_BETTER'),

-- Équilibre dynamique
((SELECT id FROM catalog_subthemes WHERE name = 'Équilibre dynamique' LIMIT 1), 'Marche en équilibre', 'EQ_DYN_001', 'Distance parcourue sur poutre sans chute', 'mètres', 'HIGHER_IS_BETTER'),

-- Latéralité
((SELECT id FROM catalog_subthemes WHERE name = 'Latéralité manuelle' LIMIT 1), 'Test de latéralité manuelle', 'LAT_001', 'Dominance manuelle (1=gauche, 2=droite)', 'score', 'HIGHER_IS_BETTER')
ON CONFLICT DO NOTHING;