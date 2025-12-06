// Script para ejecutar la migración de Crema en Pizza Verde
// Ejecutar con: node run-migration.js

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'pizza.db');
const db = new Database(dbPath);

console.log('🔄 Iniciando migración: Agregar Crema a Pizza Verde...\n');

try {
  // Iniciar transacción
  db.exec('BEGIN TRANSACTION');

  // Insertar Crema en las recetas de Pizza Verde
  const stmt = db.prepare(`
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
    )
  `);

  const result = stmt.run();
  console.log(`✅ Filas insertadas: ${result.changes}`);

  // Verificar los resultados
  const verification = db.prepare(`
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
    ORDER BY r.size, i.name
  `).all();

  console.log('\n📋 Verificación - Salsas en Pizza Verde:');
  console.table(verification);

  // Commit de la transacción
  db.exec('COMMIT');

  console.log('\n✅ Migración completada exitosamente!');
  console.log('🎉 Pizza Verde ahora tiene Pomodoro y Crema como opciones');

} catch (error) {
  console.error('❌ Error durante la migración:', error.message);
  db.exec('ROLLBACK');
  process.exit(1);
} finally {
  db.close();
}
