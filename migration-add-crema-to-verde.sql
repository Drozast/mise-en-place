-- ============================================================================
-- MIGRATION: Add Crema as sauce option to Pizza Verde
-- Date: 2025-12-05
-- Author: Claude Code
-- Description: Allows Pizza Verde to use either Pomodoro OR Crema sauce
--
-- IMPORTANT NOTES:
-- 1. This adds Crema to the recipe, but only ONE sauce is used per pizza
-- 2. When recording a sale, the system will ask which sauce was used
-- 3. Only the selected sauce will be deducted from inventory
-- 4. The UI groups multiple sauces as "Pomodoro o Crema"
-- ============================================================================

BEGIN TRANSACTION;

-- Step 1: Add Crema to Pizza Verde recipes (all sizes)
-- Using same quantities as Pomodoro: L=100ml, M=100ml, S=50ml
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity)
SELECT
    r.id,
    131 as ingredient_id,  -- Crema (ingredient_id = 131)
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

-- Step 2: Verify the changes
SELECT '=== VERIFICATION: Pizza Verde Sauces ===' as status;
SELECT
    r.name as pizza,
    r.size,
    i.name as salsa,
    ri.quantity as cantidad,
    i.unit
FROM recipes r
JOIN recipe_ingredients ri ON r.id = ri.recipe_id
JOIN ingredients i ON ri.ingredient_id = i.id
WHERE r.name = 'Verde' AND i.category = 'salsas'
ORDER BY r.size, i.name;

COMMIT;

-- Expected Result:
-- Pizza Verde L should have: Pomodoro (100ml) AND Crema (100ml)
-- Pizza Verde M should have: Pomodoro (100ml) AND Crema (100ml)
-- Pizza Verde S should have: Pomodoro (50ml) AND Crema (50ml)
--
-- When selling, only ONE of the two sauces will be deducted!
