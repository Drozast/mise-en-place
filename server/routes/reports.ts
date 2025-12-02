import { Router, Request, Response } from 'express';
import { db } from '../database/db.js';

const router = Router();

// GET shopping list based on sales and current stock
router.get('/shopping-list', (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    // Get all ingredients that need restocking
    const lowIngredients = db.sqlite.prepare(`
      SELECT
        id,
        name,
        unit,
        current_percentage,
        critical_threshold,
        warning_threshold,
        category,
        (100 - current_percentage) as needed_percentage
      FROM ingredients
      WHERE current_percentage < warning_threshold
      ORDER BY current_percentage ASC
    `).all();

    // Get recent sales to predict demand
    let salesQuery = `
      SELECT
        ri.ingredient_id,
        i.name as ingredient_name,
        SUM(s.quantity * ri.quantity) as total_consumed
      FROM sales s
      JOIN recipe_ingredients ri ON s.recipe_id = ri.recipe_id
      JOIN ingredients i ON ri.ingredient_id = i.id
    `;

    const params: any[] = [];

    if (date) {
      salesQuery += ' WHERE DATE(s.timestamp) = ?';
      params.push(date);
    } else {
      // Last 7 days by default
      salesQuery += ' WHERE s.timestamp >= datetime(\'now\', \'-7 days\')';
    }

    salesQuery += ' GROUP BY ri.ingredient_id';

    const salesData = db.sqlite.prepare(salesQuery).all(...params);

    // Combine data
    const shoppingList = lowIngredients.map((ing: any) => {
      const salesInfo = salesData.find((s: any) => s.ingredient_id === ing.id);

      return {
        ...ing,
        total_consumed: salesInfo?.total_consumed || 0,
        priority: ing.current_percentage <= ing.critical_threshold ? 'high' : 'medium'
      };
    });

    res.json(shoppingList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar lista de compras' });
  }
});

// GET daily report
router.get('/daily', (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Sales summary
    const sales = db.sqlite.prepare(`
      SELECT
        r.name,
        r.type,
        SUM(s.quantity) as total_quantity,
        COUNT(s.id) as sale_count
      FROM sales s
      JOIN recipes r ON s.recipe_id = r.id
      WHERE DATE(s.timestamp) = ?
      GROUP BY r.id
      ORDER BY total_quantity DESC
    `).all(targetDate);

    // Shifts summary
    const shifts = db.sqlite.prepare(`
      SELECT
        s.*,
        COUNT(st.id) as total_tasks,
        SUM(CASE WHEN st.completed = 1 THEN 1 ELSE 0 END) as completed_tasks
      FROM shifts s
      LEFT JOIN shift_tasks st ON s.id = st.shift_id
      WHERE s.date = ?
      GROUP BY s.id
    `).all(targetDate);

    // Alerts summary
    const alerts = db.sqlite.prepare(`
      SELECT type, COUNT(*) as count
      FROM alerts
      WHERE DATE(created_at) = ? AND resolved = 0
      GROUP BY type
    `).all(targetDate);

    // Low stock ingredients
    const lowStock = db.sqlite.prepare(`
      SELECT name, current_percentage, category
      FROM ingredients
      WHERE current_percentage < critical_threshold
      ORDER BY current_percentage ASC
    `).all();

    res.json({
      date: targetDate,
      sales,
      shifts,
      alerts,
      lowStock
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar reporte diario' });
  }
});

// GET weekly report (Tuesday to Saturday)
router.get('/weekly', (req: Request, res: Response) => {
  try {
    const { week_start } = req.query;

    let weekStartDate: Date;

    if (week_start) {
      weekStartDate = new Date(week_start as string);
    } else {
      // Calculate current week's Tuesday
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysUntilTuesday = (dayOfWeek + 5) % 7;
      weekStartDate = new Date(now);
      weekStartDate.setDate(now.getDate() - daysUntilTuesday);
    }

    const weekStart = weekStartDate.toISOString().split('T')[0];

    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 4); // Saturday
    const weekEnd = weekEndDate.toISOString().split('T')[0];

    // Sales summary for the week
    const sales = db.sqlite.prepare(`
      SELECT
        DATE(s.timestamp) as date,
        r.name,
        r.type,
        SUM(s.quantity) as total_quantity
      FROM sales s
      JOIN recipes r ON s.recipe_id = r.id
      WHERE DATE(s.timestamp) BETWEEN ? AND ?
      GROUP BY DATE(s.timestamp), r.id
      ORDER BY date, total_quantity DESC
    `).all(weekStart, weekEnd);

    // Employee performance
    const performance = db.sqlite.prepare(`
      SELECT * FROM weekly_achievements
      WHERE week_start = ?
      ORDER BY tasks_completed DESC
    `).all(weekStart);

    // Total shifts
    const shifts = db.sqlite.prepare(`
      SELECT
        date,
        type,
        employee_name,
        COUNT(st.id) as total_tasks,
        SUM(CASE WHEN st.completed = 1 THEN 1 ELSE 0 END) as completed_tasks
      FROM shifts s
      LEFT JOIN shift_tasks st ON s.id = st.shift_id
      WHERE s.date BETWEEN ? AND ?
      GROUP BY s.id
    `).all(weekStart, weekEnd);

    res.json({
      week_start: weekStart,
      week_end: weekEnd,
      sales,
      performance,
      shifts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar reporte semanal' });
  }
});

export default router;
