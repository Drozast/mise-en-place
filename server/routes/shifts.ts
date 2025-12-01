import { Router, Request, Response } from 'express';
import { db } from '../database/db.js';
import { Shift, ShiftTask } from '../types/index.js';

const router = Router();

// Default tasks for each shift type
const DEFAULT_AM_TASKS = [
  'Preparar masa del día',
  'Cortar ingredientes frescos',
  'Revisar stock de mise en place',
  'Limpiar área de trabajo',
  'Precalentar hornos',
];

const DEFAULT_PM_TASKS = [
  'Revisar niveles de ingredientes',
  'Reponer mise en place según alertas',
  'Limpiar mesas y área de servicio',
  'Verificar temperatura de refrigeradores',
  'Preparar cierre',
];

// GET all shifts
router.get('/', (req: Request, res: Response) => {
  try {
    const { date, status } = req.query;

    let query = 'SELECT * FROM shifts';
    const params: any[] = [];
    const conditions: string[] = [];

    if (date) {
      conditions.push('date = ?');
      params.push(date);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY date DESC, type';

    const shifts = db.sqlite.prepare(query).all(...params);

    // Get tasks for each shift
    const shiftsWithTasks = shifts.map((shift: any) => {
      const tasks = db.sqlite.prepare('SELECT * FROM shift_tasks WHERE shift_id = ?').all(shift.id);
      return { ...shift, tasks };
    });

    res.json(shiftsWithTasks);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener turnos' });
  }
});

// GET current open shift
router.get('/current', (req: Request, res: Response) => {
  try {
    const shift = db.sqlite.prepare(`
      SELECT * FROM shifts
      WHERE status = 'open'
      ORDER BY start_time DESC
      LIMIT 1
    `).get();

    if (!shift) {
      return res.json(null);
    }

    const tasks = db.sqlite.prepare('SELECT * FROM shift_tasks WHERE shift_id = ?').all((shift as any).id);

    res.json({ ...shift, tasks });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener turno actual' });
  }
});

// POST create shift
router.post('/', (req: Request, res: Response) => {
  try {
    const { date, type, employee_name } = req.body;

    // Check if there's already an open shift
    const openShift = db.sqlite.prepare('SELECT * FROM shifts WHERE status = ?').get('open');

    if (openShift) {
      return res.status(400).json({ error: 'Ya hay un turno abierto. Ciérralo antes de abrir uno nuevo.' });
    }

    const stmt = db.sqlite.prepare(`
      INSERT INTO shifts (date, type, employee_name, start_time)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(date, type, employee_name);
    const shiftId = result.lastInsertRowid;

    // Add default tasks
    const tasks = type === 'AM' ? DEFAULT_AM_TASKS : DEFAULT_PM_TASKS;
    const taskStmt = db.sqlite.prepare(`
      INSERT INTO shift_tasks (shift_id, task_name)
      VALUES (?, ?)
    `);

    for (const task of tasks) {
      taskStmt.run(shiftId, task);
    }

    const newShift = db.sqlite.prepare('SELECT * FROM shifts WHERE id = ?').get(shiftId);
    const shiftTasks = db.sqlite.prepare('SELECT * FROM shift_tasks WHERE shift_id = ?').all(shiftId);

    const completeShift = { ...newShift, tasks: shiftTasks };

    // Emit update via socket
    const io = req.app.get('io');
    io.emit('shift:opened', completeShift);

    res.status(201).json(completeShift);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear turno' });
  }
});

// PUT close shift
router.put('/:id/close', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if all critical tasks are done and mise en place is sufficient
    const shift = db.sqlite.prepare('SELECT * FROM shifts WHERE id = ?').get(id) as Shift;

    if (!shift) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    if (shift.status === 'closed') {
      return res.status(400).json({ error: 'El turno ya está cerrado' });
    }

    // Check critical ingredients
    const criticalIngredients = db.sqlite.prepare(`
      SELECT * FROM ingredients
      WHERE current_percentage < critical_threshold
    `).all();

    if (criticalIngredients.length > 0) {
      return res.status(400).json({
        error: 'No puedes cerrar el turno. Hay ingredientes en nivel crítico.',
        critical_ingredients: criticalIngredients
      });
    }

    const stmt = db.sqlite.prepare(`
      UPDATE shifts
      SET status = 'closed', end_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(id);

    const updated = db.sqlite.prepare('SELECT * FROM shifts WHERE id = ?').get(id);
    const tasks = db.sqlite.prepare('SELECT * FROM shift_tasks WHERE shift_id = ?').all(id);

    const completeShift = { ...updated, tasks };

    // Update weekly achievements
    updateWeeklyAchievements(shift.employee_name, tasks);

    // Emit update via socket
    const io = req.app.get('io');
    io.emit('shift:closed', completeShift);

    res.json(completeShift);
  } catch (error) {
    res.status(500).json({ error: 'Error al cerrar turno' });
  }
});

// PUT update task completion
router.put('/:shiftId/tasks/:taskId', (req: Request, res: Response) => {
  try {
    const { shiftId, taskId } = req.params;
    const { completed } = req.body;

    const stmt = db.sqlite.prepare(`
      UPDATE shift_tasks
      SET completed = ?, completed_at = ${completed ? 'CURRENT_TIMESTAMP' : 'NULL'}
      WHERE id = ? AND shift_id = ?
    `);

    stmt.run(completed ? 1 : 0, taskId, shiftId);

    const updated = db.sqlite.prepare('SELECT * FROM shift_tasks WHERE id = ?').get(taskId);

    // Emit update via socket
    const io = req.app.get('io');
    io.emit('task:updated', updated);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar tarea' });
  }
});

// Helper function to update weekly achievements
function updateWeeklyAchievements(employeeName: string, tasks: any[]) {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // Find Tuesday of current week
  const daysUntilTuesday = (dayOfWeek + 5) % 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysUntilTuesday);
  weekStart.setHours(0, 0, 0, 0);

  // Saturday is end of week
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 4);

  const weekStartStr = weekStart.toISOString().split('T')[0];
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const completedCount = tasks.filter((t: any) => t.completed === 1).length;
  const totalCount = tasks.length;

  const existing = db.sqlite.prepare(`
    SELECT * FROM weekly_achievements
    WHERE week_start = ? AND employee_name = ?
  `).get(weekStartStr, employeeName);

  if (existing) {
    db.sqlite.prepare(`
      UPDATE weekly_achievements
      SET tasks_completed = tasks_completed + ?, total_tasks = total_tasks + ?
      WHERE week_start = ? AND employee_name = ?
    `).run(completedCount, totalCount, weekStartStr, employeeName);
  } else {
    db.sqlite.prepare(`
      INSERT INTO weekly_achievements (week_start, week_end, employee_name, tasks_completed, total_tasks)
      VALUES (?, ?, ?, ?, ?)
    `).run(weekStartStr, weekEndStr, employeeName, completedCount, totalCount);
  }
}

export default router;
