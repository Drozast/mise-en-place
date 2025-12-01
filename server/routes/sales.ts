import { Router, Request, Response } from 'express';
import { db } from '../database/db.js';
import { Sale, RecipeIngredient, Ingredient } from '../types/index.js';

const router = Router();

// GET all sales
router.get('/', (req: Request, res: Response) => {
  try {
    const { shift_id, date } = req.query;

    let query = `
      SELECT s.*, r.name as recipe_name, r.type as recipe_type
      FROM sales s
      JOIN recipes r ON s.recipe_id = r.id
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (shift_id) {
      conditions.push('s.shift_id = ?');
      params.push(shift_id);
    }

    if (date) {
      conditions.push('DATE(s.timestamp) = ?');
      params.push(date);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.timestamp DESC';

    const sales = db.sqlite.prepare(query).all(...params);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
});

// POST register sale
router.post('/', (req: Request, res: Response) => {
  try {
    const { shift_id, recipe_id, quantity } = req.body;

    // Get recipe ingredients
    const recipeIngredients = db.sqlite.prepare(`
      SELECT ri.*, i.name, i.unit, i.current_percentage
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = ?
    `).all(recipe_id) as any[];

    // Calculate percentage decrease for each ingredient
    // Assuming each recipe uses a certain percentage of the total capacity
    const updates: { id: number; newPercentage: number }[] = [];

    for (const ing of recipeIngredients) {
      // This is a simplified calculation
      // You might want to adjust based on actual capacity/units
      const percentageDecrease = ing.quantity * quantity;
      const newPercentage = Math.max(0, ing.current_percentage - percentageDecrease);

      updates.push({ id: ing.ingredient_id, newPercentage });
    }

    // Update ingredients in a transaction
    const updateStmt = db.sqlite.prepare(`
      UPDATE ingredients
      SET current_percentage = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    for (const update of updates) {
      updateStmt.run(update.newPercentage, update.id);
    }

    // Register sale
    const saleStmt = db.sqlite.prepare(`
      INSERT INTO sales (shift_id, recipe_id, quantity)
      VALUES (?, ?, ?)
    `);

    const result = saleStmt.run(shift_id, recipe_id, quantity);

    const newSale = db.sqlite.prepare(`
      SELECT s.*, r.name as recipe_name, r.type as recipe_type
      FROM sales s
      JOIN recipes r ON s.recipe_id = r.id
      WHERE s.id = ?
    `).get(result.lastInsertRowid);

    // Check for alerts on updated ingredients
    const io = req.app.get('io');

    for (const update of updates) {
      const ingredient = db.sqlite.prepare('SELECT * FROM ingredients WHERE id = ?').get(update.id) as Ingredient;
      checkAndCreateAlert(ingredient, io);
      io.emit('ingredient:updated', ingredient);
    }

    io.emit('sale:registered', newSale);

    res.status(201).json(newSale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar venta' });
  }
});

// GET sales summary by date
router.get('/summary', (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    let query = `
      SELECT
        r.name,
        r.type,
        SUM(s.quantity) as total_quantity,
        COUNT(s.id) as sale_count
      FROM sales s
      JOIN recipes r ON s.recipe_id = r.id
    `;

    const params: any[] = [];

    if (date) {
      query += ' WHERE DATE(s.timestamp) = ?';
      params.push(date);
    }

    query += ' GROUP BY r.id ORDER BY total_quantity DESC';

    const summary = db.sqlite.prepare(query).all(...params);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener resumen de ventas' });
  }
});

// Helper function to check and create alerts
function checkAndCreateAlert(ingredient: Ingredient, io: any) {
  const percentage = ingredient.current_percentage;

  // Check if there's already an unresolved alert for this ingredient
  const existingAlert = db.sqlite.prepare(`
    SELECT * FROM alerts
    WHERE ingredient_id = ? AND resolved = 0
  `).get(ingredient.id);

  if (existingAlert) return;

  let alertType: 'critical' | 'warning' | null = null;
  let message = '';

  if (percentage <= ingredient.critical_threshold) {
    alertType = 'critical';
    message = `¡CRÍTICO! ${ingredient.name} está al ${percentage}% (umbral: ${ingredient.critical_threshold}%)`;
  } else if (percentage <= ingredient.warning_threshold) {
    alertType = 'warning';
    message = `Advertencia: ${ingredient.name} está al ${percentage}% (umbral: ${ingredient.warning_threshold}%)`;
  }

  if (alertType) {
    const stmt = db.sqlite.prepare(`
      INSERT INTO alerts (type, message, ingredient_id, priority)
      VALUES (?, ?, ?, ?)
    `);

    const priority = alertType === 'critical' ? 3 : 2;
    const result = stmt.run(alertType, message, ingredient.id, priority);

    const newAlert = db.sqlite.prepare('SELECT * FROM alerts WHERE id = ?').get(result.lastInsertRowid);
    io.emit('alert:created', newAlert);
  }
}

export default router;
