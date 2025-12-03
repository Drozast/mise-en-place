import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/pizza.db');
const sqlite = new Database(dbPath);

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

const initialize = () => {
  // Tabla de usuarios
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rut TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('empleado', 'chef')),
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  // Crear usuario admin por defecto si no existe
  const adminExists = sqlite.prepare('SELECT * FROM users WHERE rut = ?').get('11111111-1');
  if (!adminExists) {
    sqlite.prepare(`
      INSERT INTO users (rut, password, name, role)
      VALUES (?, ?, ?, ?)
    `).run('11111111-1', '1111', 'Administrador', 'chef');
  }

  // Tabla de ingredientes
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      unit TEXT NOT NULL,
      current_percentage INTEGER DEFAULT 100,
      critical_threshold INTEGER DEFAULT 50,
      warning_threshold INTEGER DEFAULT 80,
      category TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de recetas (pizzas y tablas)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('pizza', 'tabla')),
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de ingredientes por receta
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      ingredient_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
      UNIQUE(recipe_id, ingredient_id)
    )
  `);

  // Tabla de turnos
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('AM', 'PM')),
      employee_name TEXT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed')),
      checklist_signed INTEGER DEFAULT 0,
      checklist_signed_by TEXT,
      checklist_signed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de checklist de tareas por turno
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS shift_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id INTEGER NOT NULL,
      task_name TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      completed_at DATETIME,
      FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
    )
  `);

  // Tabla de ventas
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id INTEGER NOT NULL,
      recipe_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    )
  `);

  // Tabla de alertas
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('critical', 'warning', 'info', 'suggestion')),
      message TEXT NOT NULL,
      ingredient_id INTEGER,
      priority INTEGER DEFAULT 1,
      resolved INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
    )
  `);

  // Tabla de restoqueos (restock)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS restocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ingredient_id INTEGER NOT NULL,
      previous_percentage INTEGER NOT NULL,
      new_percentage INTEGER NOT NULL,
      authorized_by TEXT NOT NULL,
      shift_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
      FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL
    )
  `);

  // Tabla de gamificación (tracking semanal)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS weekly_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start DATE NOT NULL,
      week_end DATE NOT NULL,
      employee_name TEXT NOT NULL,
      tasks_completed INTEGER DEFAULT 0,
      total_tasks INTEGER DEFAULT 0,
      premio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(week_start, employee_name)
    )
  `);

  // Tabla de premios/recompensas
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT DEFAULT '🎁',
      active INTEGER DEFAULT 1,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de configuración de mise en place
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS mise_en_place_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      base_pizza_count INTEGER DEFAULT 20,
      size_l_percentage INTEGER DEFAULT 60,
      size_m_percentage INTEGER DEFAULT 25,
      size_s_percentage INTEGER DEFAULT 15,
      min_close_percentage INTEGER DEFAULT 80,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insertar configuración por defecto si no existe
  const settingsExists = sqlite.prepare('SELECT * FROM mise_en_place_settings').get();
  if (!settingsExists) {
    sqlite.prepare(`
      INSERT INTO mise_en_place_settings (base_pizza_count, size_l_percentage, size_m_percentage, size_s_percentage, min_close_percentage)
      VALUES (20, 60, 25, 15, 80)
    `).run();
  }

  // Tabla de mise en place por turno (snapshot inicial del turno)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS shift_mise_en_place (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id INTEGER NOT NULL,
      ingredient_id INTEGER NOT NULL,
      initial_quantity REAL NOT NULL,
      current_quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
      UNIQUE(shift_id, ingredient_id)
    )
  `);

  // Migración: Recrear tabla recipes sin UNIQUE constraint en name
  try {
    // Verificar si necesitamos migrar
    const tableInfo = sqlite.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='recipes'").get() as any;

    if (tableInfo && tableInfo.sql.includes('name TEXT NOT NULL UNIQUE')) {
      console.log('🔄 Migrando tabla recipes para permitir nombres duplicados con diferentes tamaños...');

      // Backup de datos existentes
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS recipes_backup AS SELECT * FROM recipes;
        DROP TABLE recipes;

        CREATE TABLE recipes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('pizza', 'tabla')),
          size TEXT CHECK(size IN ('S', 'M', 'L')),
          active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(name, size, type)
        );

        INSERT INTO recipes (id, name, type, active, created_at)
        SELECT id, name, type, active, created_at FROM recipes_backup;

        DROP TABLE recipes_backup;
      `);

      console.log('✅ Tabla recipes migrada correctamente');
    }
  } catch (error) {
    console.error('Error en migración de recipes:', error);
  }

  // Migración: Agregar size a recipes si no existe
  try {
    const columns = sqlite.pragma('table_info(recipes)');
    const hasSize = columns.some((col: any) => col.name === 'size');
    if (!hasSize) {
      sqlite.exec(`ALTER TABLE recipes ADD COLUMN size TEXT CHECK(size IN ('S', 'M', 'L'))`);
      console.log('✅ Campo size agregado a la tabla recipes');
    }
  } catch (error) {
    console.error('Error agregando size:', error);
  }

  // Migración: Agregar total_quantity si no existe
  try {
    const columns = sqlite.pragma('table_info(ingredients)');
    const hasTotal = columns.some((col: any) => col.name === 'total_quantity');
    if (!hasTotal) {
      sqlite.exec(`ALTER TABLE ingredients ADD COLUMN total_quantity REAL DEFAULT 1000`);
      console.log('✅ Campo total_quantity agregado a la tabla ingredients');
    }
  } catch (error) {
    console.error('Error en migración de total_quantity:', error);
  }

  // Migración: Agregar current_quantity si no existe
  try {
    const columns = sqlite.pragma('table_info(ingredients)');
    const hasCurrent = columns.some((col: any) => col.name === 'current_quantity');
    if (!hasCurrent) {
      sqlite.exec(`ALTER TABLE ingredients ADD COLUMN current_quantity REAL DEFAULT 1000`);
      console.log('✅ Campo current_quantity agregado a la tabla ingredients');
    }
  } catch (error) {
    console.error('Error en migración de current_quantity:', error);
  }

  // Migración: Agregar campos de firma de checklist a shifts
  try {
    const columns = sqlite.pragma('table_info(shifts)');
    const hasChecklistSigned = columns.some((col: any) => col.name === 'checklist_signed');
    if (!hasChecklistSigned) {
      sqlite.exec(`
        ALTER TABLE shifts ADD COLUMN checklist_signed INTEGER DEFAULT 0;
        ALTER TABLE shifts ADD COLUMN checklist_signed_by TEXT;
        ALTER TABLE shifts ADD COLUMN checklist_signed_at DATETIME;
      `);
      console.log('✅ Campos de firma de checklist agregados a la tabla shifts');
    }
  } catch (error) {
    console.error('Error en migración de checklist_signed:', error);
  }

  console.log('✅ Base de datos inicializada correctamente');
};

export const db = {
  sqlite,
  initialize,
};
