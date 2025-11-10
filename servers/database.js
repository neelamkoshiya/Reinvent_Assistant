import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'reinvent_schedule.db');
const csvPath = join(__dirname, '../reinvent-2025-sessions.csv');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// re:Invent database - data loaded from Excel file

// Parse dayTime to extract day and time
function parseDayTime(dayTime) {
  if (!dayTime) return { day: 'TBD', time: 'TBD' };
  
  const parts = dayTime.split(' ');
  if (parts.length >= 2) {
    const day = parts[0]; // Monday, Tuesday, etc.
    const time = parts.slice(1).join(' '); // 11:30 - 12:30
    return { day, time };
  }
  
  return { day: dayTime, time: 'TBD' };
}

// Load CSV data into database
function loadCSVData() {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(csvPath)) {
        console.log('CSV file not found, skipping data load');
        resolve();
        return;
      }

      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      console.log(`Loading ${records.length} sessions from CSV...`);

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO sessions (
          id, type, level, title, description, speakers, venue, 
          day, time, dayTime, services, tags, url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let loadedCount = 0;
      records.forEach(record => {
        const { day, time } = parseDayTime(record.dayTime);
        
        stmt.run([
          record.id,
          record.type || 'Session',
          record.level || '200',
          record.title || 'Untitled Session',
          record.description || '',
          record.speakers || 'TBD',
          record.venue || 'TBD',
          day,
          time,
          record.dayTime || 'TBD',
          record.services || '',
          record.tags || '',
          record.url || ''
        ]);
        loadedCount++;
      });

      stmt.finalize((err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Successfully loaded ${loadedCount} sessions`);
          resolve();
        }
      });

    } catch (error) {
      reject(error);
    }
  });
}

// Initialize database with tables and data
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create tables - updated for 2025 CSV structure
      db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          level TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          speakers TEXT,
          venue TEXT,
          day TEXT,
          time TEXT,
          dayTime TEXT,
          services TEXT,
          tags TEXT,
          url TEXT
        )
      `);

      // Check if we have existing data
      db.get('SELECT COUNT(*) as count FROM sessions', (err, row) => {
        if (err) {
          reject(err);
        } else {
          const existingCount = row.count;
          console.log(`Database has ${existingCount} re:Invent sessions`);
          
          // Load CSV data if database is empty or has few records
          if (existingCount < 100) {
            loadCSVData()
              .then(() => resolve())
              .catch(reject);
          } else {
            resolve();
          }
        }
      });
    });
  });
}

// Database query functions
export const dbQueries = {
  // Search sessions
  searchSessions: (query, track, level, day) => {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM sessions WHERE 1=1';
      const params = [];

      if (query) {
        sql += ' AND (title LIKE ? OR description LIKE ? OR speakers LIKE ? OR tags LIKE ? OR services LIKE ? OR type LIKE ?)';
        const searchTerm = `%${query}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (track) {
        sql += ' AND type = ?';
        params.push(track);
      }

      if (level) {
        sql += ' AND level = ?';
        params.push(level);
      }

      if (day) {
        sql += ' AND day = ?';
        params.push(day);
      }

      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // Get session by ID
  getSessionById: (sessionId) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM sessions WHERE id = ?', [sessionId], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(row);
        } else {
          resolve(null);
        }
      });
    });
  },

  // Get sessions by day
  getSessionsByDay: (day) => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM sessions WHERE day = ? ORDER BY time', [day], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // Get all sessions
  getAllSessions: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM sessions ORDER BY day, time', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // Get unique tracks (session types)
  getTracks: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT DISTINCT type FROM sessions ORDER BY type', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => row.type));
        }
      });
    });
  },

  // Get unique venues
  getVenues: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT DISTINCT venue FROM sessions ORDER BY venue', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => row.venue));
        }
      });
    });
  },

  // Get unique levels
  getLevels: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT DISTINCT level FROM sessions ORDER BY level', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => row.level));
        }
      });
    });
  },

  // Get unique days
  getDays: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT DISTINCT day FROM sessions ORDER BY day', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => row.day));
        }
      });
    });
  }
};

// Initialize the database
initializeDatabase().catch(console.error);

export default db;