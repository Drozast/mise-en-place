import { Router, Request, Response } from 'express';
import { db } from '../database/db.js';

const router = Router();

// GET current week achievements
router.get('/current-week', (req: Request, res: Response) => {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();

    // Find Tuesday of current week
    const daysUntilTuesday = (dayOfWeek + 5) % 7;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysUntilTuesday);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const achievements = db.sqlite.prepare(`
      SELECT * FROM weekly_achievements
      WHERE week_start = ?
      ORDER BY tasks_completed DESC
    `).all(weekStartStr);

    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener logros de la semana' });
  }
});

// GET leaderboard
router.get('/leaderboard', (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const leaderboard = db.sqlite.prepare(`
      SELECT
        employee_name,
        SUM(tasks_completed) as total_completed,
        SUM(total_tasks) as total_tasks,
        COUNT(*) as weeks_worked,
        CAST(SUM(tasks_completed) AS FLOAT) / CAST(SUM(total_tasks) AS FLOAT) * 100 as completion_rate
      FROM weekly_achievements
      GROUP BY employee_name
      ORDER BY completion_rate DESC, total_completed DESC
      LIMIT ?
    `).all(limit);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tabla de líderes' });
  }
});

// POST assign reward
router.post('/reward', (req: Request, res: Response) => {
  try {
    const { week_start, employee_name, premio } = req.body;

    const stmt = db.sqlite.prepare(`
      UPDATE weekly_achievements
      SET premio = ?
      WHERE week_start = ? AND employee_name = ?
    `);

    stmt.run(premio, week_start, employee_name);

    const updated = db.sqlite.prepare(`
      SELECT * FROM weekly_achievements
      WHERE week_start = ? AND employee_name = ?
    `).get(week_start, employee_name);

    // Emit update via socket
    const io = req.app.get('io');
    io.emit('reward:assigned', updated);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error al asignar premio' });
  }
});

// GET employee stats
router.get('/employee/:name', (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    const stats = db.sqlite.prepare(`
      SELECT
        COUNT(*) as total_weeks,
        SUM(tasks_completed) as total_tasks_completed,
        SUM(total_tasks) as total_tasks,
        AVG(CAST(tasks_completed AS FLOAT) / CAST(total_tasks AS FLOAT) * 100) as avg_completion_rate,
        COUNT(CASE WHEN premio IS NOT NULL THEN 1 END) as rewards_earned
      FROM weekly_achievements
      WHERE employee_name = ?
    `).get(name);

    const recentWeeks = db.sqlite.prepare(`
      SELECT * FROM weekly_achievements
      WHERE employee_name = ?
      ORDER BY week_start DESC
      LIMIT 5
    `).all(name);

    res.json({
      employee_name: name,
      stats,
      recent_weeks: recentWeeks
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas del empleado' });
  }
});

// POST calculate weekly rewards (to be run on Saturday/Sunday)
router.post('/calculate-rewards', (req: Request, res: Response) => {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();

    // Find Tuesday of current week
    const daysUntilTuesday = (dayOfWeek + 5) % 7;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysUntilTuesday);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const achievements = db.sqlite.prepare(`
      SELECT * FROM weekly_achievements
      WHERE week_start = ?
      ORDER BY tasks_completed DESC
    `).all(weekStartStr) as any[];

    const rewards = [];

    for (const achievement of achievements) {
      const completionRate = (achievement.tasks_completed / achievement.total_tasks) * 100;

      let premio = null;

      // Award pizza if 100% completion
      if (completionRate === 100) {
        premio = 'Pizza gratis el sábado';
      }
      // Award beer if >= 90% completion
      else if (completionRate >= 90) {
        premio = 'Cerveza al final del turno';
      }

      if (premio) {
        db.sqlite.prepare(`
          UPDATE weekly_achievements
          SET premio = ?
          WHERE id = ?
        `).run(premio, achievement.id);

        rewards.push({
          employee_name: achievement.employee_name,
          premio,
          completion_rate: completionRate
        });
      }
    }

    // Emit update via socket
    const io = req.app.get('io');
    io.emit('rewards:calculated', rewards);

    res.json(rewards);
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular premios' });
  }
});

export default router;
