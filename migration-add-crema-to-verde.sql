-- Migration: Add Crema as sauce option to Pizza Verde
-- Date: 2025-12-05
-- Description: Allows Pizza Verde to use either Pomodoro or Crema sauce

-- Add Crema to Pizza Verde recipes (all sizes)
-- Using same quantities as Pomodoro: L=100ml, M=100ml, S=50ml

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity)
SELECT
    r.id,
    131 as ingredient_id,  -- Crema
    CASE
        WHEN r.size = 'L' THEN 100.0
        WHEN r.size = 'M' THEN 100.0
        WHEN r.size = 'S' THEN 50.0
    END as quantity
FROM recipes r
WHERE r.name = 'Verde'
AND NOT EXISTS (
    SELECT 1 FROM recipe_ingredients ri
    WHERE ri.recipe_id = r.id AND ri.ingredient_id = 131
);

-- Verify the changes
SELECT
    r.name as pizza,
    r.size,
    i.name as salsa,
    ri.quantity
FROM recipes r
JOIN recipe_ingredients ri ON r.id = ri.recipe_id
JOIN ingredients i ON ri.ingredient_id = i.id
WHERE r.name = 'Verde' AND i.category = 'salsas'
ORDER BY r.size, i.name;
