import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDbPool, testDbConnection, isDbConnected } from './src/server/db';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const stateTable = 'clearpass_app_state';
let stateTableSetup: Promise<void> | null = null;

const ensureStateTable = async () => {
  const pool = getDbPool();
  if (!pool || !isDbConnected()) {
    throw new Error('MySQL is not connected.');
  }

  if (!stateTableSetup) {
    stateTableSetup = pool.query(`
      CREATE TABLE IF NOT EXISTS ${stateTable} (
        state_key VARCHAR(64) PRIMARY KEY,
        state_json LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `).then(() => undefined).catch((error) => {
      stateTableSetup = null;
      throw error;
    });
  }
  await stateTableSetup;
  return pool;
};

// Enable CORS for all mobile devices, web origins, and local testing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// =========================================================================
// REAL-TIME EVENT STREAM (Server-Sent Events / SSE)
// Connects Android APKs and Admin Web for Instant Multi-Device Sync!
// =========================================================================
const sseClients = new Set<Response>();

const broadcastRealtimeEvent = (event: {
  type:
    | 'SIGNATURE_UPDATED'
    | 'SIGNATURE_REVOKED'
    | 'CLEARANCE_COMPLETED'
    | 'PROFILE_UPDATED'
    | 'HEARTBEAT'
    | 'STUDENT_CREATED'
    | 'PERSONNEL_CREATED'
    | 'USER_DELETED'
    | 'STATE_UPDATED'
    | string;
  data: any;
}) => {
  const payload = `data: ${JSON.stringify({ ...event, timestamp: new Date().toISOString() })}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  });
};

// SSE Stream Endpoint
app.get('/api/realtime/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Real-time sync established with SIA ClearPass Server' })}\n\n`);
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Periodic heartbeat every 25 seconds to keep mobile connections alive
setInterval(() => {
  broadcastRealtimeEvent({ type: 'HEARTBEAT', data: { activeConnections: sseClients.size } });
}, 25000);

// =========================================================================
// REST API ENDPOINTS
// =========================================================================

// 1. Health & Status
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'SIA ClearPass Server (Node.js + Express + MySQL)',
    school: 'St. Isidore Academy of Trinidad Bohol, Inc.',
    mysqlConnected: isDbConnected(),
    activeRealtimeClients: sseClients.size,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/state', async (_req: Request, res: Response) => {
  try {
    const pool = await ensureStateTable();
    const [rows]: any = await pool.query(
      `SELECT state_json, updated_at FROM ${stateTable} WHERE state_key = 'main' LIMIT 1`
    );
    const state = rows[0] ? JSON.parse(rows[0].state_json) : null;
    return res.json({ success: true, state, updated_at: rows[0]?.updated_at ?? null });
  } catch (err: any) {
    console.error('[MySQL GET /api/state error]:', err?.message || err);
    return res.status(503).json({ success: false, message: 'Could not load shared application data from the database.' });
  }
});

app.put('/api/state', async (req: Request, res: Response) => {
  const state = req.body?.state;
  const source = String(req.body?.source || '');
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return res.status(400).json({ success: false, message: 'A valid application state object is required.' });
  }

  try {
    const pool = await ensureStateTable();
    const serializedState = JSON.stringify(state);
    await pool.query(
      `INSERT INTO ${stateTable} (state_key, state_json)
       VALUES ('main', ?)
       ON DUPLICATE KEY UPDATE state_json = VALUES(state_json), updated_at = CURRENT_TIMESTAMP`,
      [serializedState]
    );

    broadcastRealtimeEvent({
      type: 'STATE_UPDATED',
      data: { source },
    });
    return res.json({ success: true, updated_at: new Date().toISOString() });
  } catch (err: any) {
    console.error('[MySQL PUT /api/state error]:', err?.message || err);
    return res.status(503).json({ success: false, message: 'Could not save application changes to the database.' });
  }
});

// 2. Authentication Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const term = String(username || '').trim().toLowerCase();
  const pass = String(password || '').trim();

  // Try checking in MySQL first if available
  const pool = getDbPool();
  if (pool && isDbConnected()) {
    try {
      const [rows]: any = await pool.query(
        `SELECT u.*, s.student_id, s.student_number, s.first_name, s.middle_name, s.last_name, s.suffix, s.school_level, s.school_year, s.grade_level, s.section, s.status AS student_status,
                p.personnel_id, p.employee_number, p.full_name, p.office, p.position, p.assigned_subject, p.assigned_grade_level, p.assigned_section, p.is_department_head, p.status AS personnel_status
         FROM users u
         LEFT JOIN students s ON u.user_id = s.user_id
         LEFT JOIN personnel p ON u.user_id = p.user_id
         WHERE LOWER(u.username) = ? OR LOWER(u.email) = ? OR s.student_number = ?
         LIMIT 1`,
        [term, term, term]
      );

      if (rows && rows.length > 0) {
        const found = rows[0];
        // Allow password match or simple default check
        if (found.password_hash === pass) {
          return res.json({
            success: true,
            role: found.role,
            user: {
              user_id: found.user_id,
              username: found.username,
              email: found.email,
              name: found.name,
              role: found.role,
              status: found.is_active === false ? 0 : 1,
              created_at: found.created_at,
              updated_at: found.updated_at,
            },
            student: found.student_id ? {
              student_id: found.student_id,
              user_id: found.user_id,
              student_number: found.student_number,
              first_name: found.first_name,
              middle_name: found.middle_name,
              last_name: found.last_name,
              suffix: found.suffix,
              school_level: found.school_level,
              school_year: found.school_year,
              grade_level: found.grade_level,
              section: found.section,
              status: found.student_status ?? 1,
              created_at: found.created_at,
              updated_at: found.updated_at,
            } : undefined,
            personnel: found.personnel_id ? {
              personnel_id: found.personnel_id,
              user_id: found.user_id,
              employee_number: found.employee_number,
              full_name: found.full_name,
              office: found.office,
              position: found.position,
              assigned_subject: found.assigned_subject,
              assigned_grade_level: found.assigned_grade_level,
              assigned_section: found.assigned_section,
              is_department_head: !!found.is_department_head,
              department_head_title: found.position,
              status: found.personnel_status ?? 1,
              created_at: found.created_at,
              updated_at: found.updated_at,
            } : undefined,
          });
        }
      }
    } catch (err) {
      console.warn('[MySQL Auth Query Warning]:', err);
    }
  }

  // Fallback credentials
  if (term === 'admin' && (pass === 'admin123' || pass === 'adminpassword123')) {
    return res.json({
      success: true,
      role: 'Administrator',
      user: {
        user_id: 'usr_admin',
        username: 'admin',
        name: 'ClearPass System Administrator',
        role: 'Administrator',
      },
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid credentials. Please verify your username and password.',
  });
});

// =========================================================================
// 3. STUDENTS CRUD (INSERT / SELECT / DELETE IN MYSQL)
// =========================================================================

// Get All Students from MySQL
app.get('/api/students', async (_req: Request, res: Response) => {
  const pool = getDbPool();
  if (pool && isDbConnected()) {
    try {
      const [rows]: any = await pool.query(
        `SELECT s.*, u.username, u.email, u.name,
                r.overall_status, r.progress_percentage
         FROM students s
         JOIN users u ON s.user_id = u.user_id
         LEFT JOIN student_clearance_records r ON s.student_id = r.student_id
         ORDER BY s.last_name ASC, s.first_name ASC`
      );
      return res.json({ success: true, count: rows.length, data: rows });
    } catch (err: any) {
      console.warn('[MySQL GET /api/students error]:', err?.message);
    }
  }
  return res.json({ success: false, message: 'MySQL is offline, using memory state', data: [] });
});

// Create/Enroll Student in MySQL (Called by Administrator Web Portal)
app.post('/api/students', async (req: Request, res: Response) => {
  console.log('📥 [API] POST /api/students received! Body:', req.body);

  const lrn = String(req.body.student_number || req.body.studentNumber || req.body.lrn || '').trim();
  const fName = String(req.body.first_name || req.body.firstName || '').trim();
  const mName = String(req.body.middle_name || req.body.middleName || '').trim();
  const lName = String(req.body.last_name || req.body.lastName || '').trim();
  const suf = String(req.body.suffix || '').trim();
  const rawLevel = String(req.body.school_level || req.body.schoolLevel || '');
  const rawGrade = String(req.body.grade_level || req.body.gradeLevel || 'Grade 9');
  const sect = String(req.body.section || 'Rose');
  const sYear = String(req.body.school_year || req.body.schoolYear || '2026-2027');
  let uName = String(req.body.username || '').trim() || `${fName.toLowerCase()}.${lName.toLowerCase()}`.replace(/\s+/g, '');
  let uEmail = String(req.body.email || '').trim() || `${uName}_${Date.now().toString().slice(-4)}@sia.edu.ph`;
  const pass = String(req.body.password || '').trim() || (lrn.length >= 4 ? lrn.slice(-4) : '1234');

  if (!fName || !lName || !lrn) {
    console.warn('⚠️ [API] Missing required fields: first_name, last_name, or student_number');
    return res.status(400).json({ error: 'First name, last name, and LRN/Student number are required.' });
  }

  const userId = String(req.body.user_id || 'usr_' + Date.now());
  const studentId = String(req.body.student_id || 'std_' + Date.now());
  const sLevel = rawLevel.includes('Senior') || rawGrade.includes('11') || rawGrade.includes('12') ? 'Senior High School' : 'Junior High School';
  const fullName = `${lName}, ${fName} ${mName} ${suf}`.trim();

  const pool = getDbPool();
  let mysqlInserted = false;
  let finalUserId = userId;
  let finalStudentId = studentId;

  if (!pool || !isDbConnected()) {
    return res.status(503).json({ success: false, error: 'Database is offline. Student was not created.' });
  }

  try {
    // 1. Check if username or email already exists in users table
    const [existingUsers]: any = await pool.query(
      `SELECT user_id, role, username FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?) LIMIT 1`,
      [uName, uEmail]
    );

    if (existingUsers && existingUsers.length > 0) {
      const existing = existingUsers[0];
      // If the username is already taken by Personnel or Admin, create unique student username
      if (existing.role !== 'Student') {
        uName = `${uName}.${lrn.slice(-4)}`;
        uEmail = `${uName}@sia.edu.ph`;
        await pool.query(
          `INSERT INTO users (user_id, username, email, password_hash, role, name)
             VALUES (?, ?, ?, ?, 'Student', ?)`,
          [finalUserId, uName, uEmail, pass, fullName]
        );
      } else {
        // If already an existing student, use their existing user_id
        finalUserId = existing.user_id;
        await pool.query(
          `UPDATE users SET name = ?, password_hash = ? WHERE user_id = ?`,
          [fullName, pass, finalUserId]
        );
      }
    } else {
      // Brand new user
      await pool.query(
        `INSERT INTO users (user_id, username, email, password_hash, role, name)
         VALUES (?, ?, ?, ?, 'Student', ?)`,
        [finalUserId, uName, uEmail, pass, fullName]
      );
    }

    // 2. Check if student already exists by LRN (student_number)
    const [existingStudents]: any = await pool.query(
      `SELECT student_id, user_id FROM students WHERE student_number = ? LIMIT 1`,
      [lrn]
    );

    if (existingStudents && existingStudents.length > 0) {
      finalStudentId = existingStudents[0].student_id;
      await pool.query(
        `UPDATE students 
           SET first_name = ?, middle_name = ?, last_name = ?, suffix = ?, school_level = ?, grade_level = ?, section = ?, school_year = ?
           WHERE student_id = ?`,
        [fName, mName, lName, suf, sLevel, rawGrade, sect, sYear, finalStudentId]
      );
    } else {
      await pool.query(
        `INSERT INTO students (student_id, user_id, student_number, first_name, middle_name, last_name, suffix, school_level, grade_level, section, school_year)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [finalStudentId, finalUserId, lrn, fName, mName, lName, suf, sLevel, rawGrade, sect, sYear]
      );
    }

    mysqlInserted = true;
    console.log(`✅ [MySQL] Successfully inserted student "${fullName}" (LRN: ${lrn}, Username: "${uName}") into database!`);
  } catch (err: any) {
    console.error('❌ [MySQL Student Insert Error]:', err?.message || err);
    return res.status(500).json({ error: 'Failed to insert student into MySQL database: ' + err?.message });
  }

  const createdStudent = {
    student_id: finalStudentId,
    user_id: finalUserId,
    student_number: lrn,
    first_name: fName,
    middle_name: mName,
    last_name: lName,
    suffix: suf,
    school_level: sLevel,
    grade_level: rawGrade,
    section: sect,
    school_year: sYear,
    username: uName,
    email: uEmail,
    mysqlSaved: mysqlInserted,
  };

  const createdUser = {
    user_id: finalUserId,
    auth_user_id: `auth_${finalUserId}`,
    name: fullName,
    email: uEmail,
    role: 'Student',
    status: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  broadcastRealtimeEvent({
    type: 'STUDENT_CREATED',
    data: { user: createdUser, student: createdStudent },
  });

  return res.json({
    success: true,
    message: `Student "${fullName}" enrolled and saved to MySQL successfully!`,
    user: createdUser,
    student: createdStudent,
  });
});

app.put('/api/students/:student_id', async (req: Request, res: Response) => {
  const studentId = String(req.params.student_id || '').trim();
  const studentNumber = String(req.body.student_number || '').trim();
  const firstName = String(req.body.first_name || '').trim();
  const middleName = String(req.body.middle_name || '').trim();
  const lastName = String(req.body.last_name || '').trim();
  const suffix = String(req.body.suffix || '').trim();
  const schoolLevel = String(req.body.school_level || '').trim();
  const gradeLevel = String(req.body.grade_level || '').trim();
  const section = String(req.body.section || '').trim();
  const schoolYear = String(req.body.school_year || '').trim();

  if (!studentId || !studentNumber || !firstName || !lastName || !schoolLevel || !gradeLevel || !section || !schoolYear) {
    return res.status(400).json({ success: false, message: 'All required student profile fields must be provided.' });
  }

  const pool = getDbPool();
  if (!pool || !isDbConnected()) {
    return res.status(503).json({ success: false, message: 'Database is offline. Student was not updated.' });
  }

  try {
    const [result]: any = await pool.query(
      `UPDATE students s
       JOIN users u ON u.user_id = s.user_id
       SET s.student_number = ?, s.first_name = ?, s.middle_name = ?, s.last_name = ?,
           s.suffix = ?, s.school_level = ?, s.grade_level = ?, s.section = ?,
           s.school_year = ?, u.name = ?
       WHERE s.student_id = ?`,
      [
        studentNumber,
        firstName,
        middleName,
        lastName,
        suffix,
        schoolLevel,
        gradeLevel,
        section,
        schoolYear,
        `${firstName} ${middleName} ${lastName} ${suffix}`.trim(),
        studentId,
      ]
    );
    if (result.affectedRows === 0) {
      const [existingRows]: any = await pool.query(
        'SELECT student_id FROM students WHERE student_id = ? LIMIT 1',
        [studentId]
      );
      if (!existingRows.length) {
        return res.status(404).json({ success: false, message: 'Student account was not found.' });
      }
    }

    const [rows]: any = await pool.query(
      'SELECT * FROM students WHERE student_id = ? LIMIT 1',
      [studentId]
    );
    return res.json({ success: true, student: rows[0] });
  } catch (err: any) {
    console.error('[MySQL PUT /api/students/:student_id error]:', err?.message || err);
    return res.status(500).json({ success: false, message: 'Failed to update student account.' });
  }
});

// =========================================================================
// 4. PERSONNEL CRUD (INSERT / SELECT / DELETE IN MYSQL)
// =========================================================================

app.put('/api/personnel/:personnel_id', async (req: Request, res: Response) => {
  const personnelId = String(req.params.personnel_id || '').trim();
  const employeeNumber = String(req.body.employee_number || '').trim();
  const fullName = String(req.body.full_name || '').trim();
  const office = String(req.body.office || '').trim();
  const position = String(req.body.position || '').trim();
  const assignedSubject = String(req.body.assigned_subject || '').trim();
  const gradeLevel = String(req.body.assigned_grade_level || '').trim();
  const section = String(req.body.assigned_section || '').trim();

  if (!personnelId || !employeeNumber || !fullName || !office || !position || !assignedSubject || !gradeLevel || !section) {
    return res.status(400).json({ success: false, message: 'All personnel profile fields are required.' });
  }

  const pool = getDbPool();
  if (!pool || !isDbConnected()) {
    return res.status(503).json({ success: false, message: 'Database is offline. Personnel was not updated.' });
  }

  try {
    const [result]: any = await pool.query(
      `UPDATE personnel p
       JOIN users u ON u.user_id = p.user_id
       SET p.employee_number = ?, p.full_name = ?, p.office = ?, p.position = ?,
           p.assigned_subject = ?, p.assigned_grade_level = ?, p.assigned_section = ?,
           p.is_department_head = ?, p.department_head_title = ?, u.name = ?
       WHERE p.personnel_id = ?`,
      [
        employeeNumber,
        fullName,
        office,
        position,
        assignedSubject,
        gradeLevel,
        section,
        true,
        position,
        fullName,
        personnelId,
      ]
    );
    if (result.affectedRows === 0) {
      const [existingRows]: any = await pool.query(
        'SELECT personnel_id FROM personnel WHERE personnel_id = ? LIMIT 1',
        [personnelId]
      );
      if (!existingRows.length) {
        return res.status(404).json({ success: false, message: 'Personnel account was not found.' });
      }
    }

    const [rows]: any = await pool.query(
      `SELECT p.*, u.username, u.email, u.name
       FROM personnel p JOIN users u ON u.user_id = p.user_id
       WHERE p.personnel_id = ? LIMIT 1`,
      [personnelId]
    );
    return res.json({ success: true, personnel: rows[0] });
  } catch (err: any) {
    console.error('[MySQL PUT /api/personnel/:personnel_id error]:', err?.message || err);
    return res.status(500).json({
      success: false,
      message: `Failed to update personnel account${err?.message ? `: ${err.message}` : '.'}`,
    });
  }
});

// Get All Personnel from MySQL
app.get('/api/personnel', async (_req: Request, res: Response) => {
  const pool = getDbPool();
  if (pool && isDbConnected()) {
    try {
      const [rows]: any = await pool.query(
        `SELECT p.*, u.username, u.email, u.name
         FROM personnel p
         JOIN users u ON p.user_id = u.user_id
         ORDER BY p.full_name ASC`
      );
      return res.json({ success: true, count: rows.length, data: rows });
    } catch (err: any) {
      console.warn('[MySQL GET /api/personnel error]:', err?.message);
    }
  }
  return res.json({ success: false, message: 'MySQL is offline, using memory state', data: [] });
});

// Create/Provision Personnel in MySQL
app.post('/api/personnel', async (req: Request, res: Response) => {
  console.log('📥 [API] POST /api/personnel received! Body:', req.body);

  const empNo = String(req.body.employee_number || req.body.employeeNumber || '').trim();
  const fName = String(req.body.full_name || req.body.fullName || req.body.name || '').trim();
  const off = String(req.body.office || 'Academic Faculty').trim();
  const pos = String(req.body.position || 'Teacher & Signatory').trim();
  const subj = String(req.body.assigned_subject || req.body.assignedSubject || 'General Academics').trim();
  const gLevel = String(req.body.assigned_grade_level || req.body.assignedGradeLevel || 'Grade 9').trim();
  const sect = String(req.body.assigned_section || req.body.assignedSection || 'All Sections').trim();
  let uName = String(req.body.username || '').trim() || fName.toLowerCase().replace(/\s+/g, '.');
  let uEmail = String(req.body.email || '').trim() || `${uName}@sia.edu.ph`;
  const pass = String(req.body.password || '').trim() || 'teacher123';

  if (!fName || !empNo) {
    console.warn('⚠️ [API] Missing required fields for personnel');
    return res.status(400).json({ error: 'Full name and employee number are required.' });
  }

  let userId = String(req.body.user_id || 'usr_' + Date.now());
  let personnelId = String(req.body.personnel_id || 'per_' + Date.now());
  const isDeptHead = true;

  const pool = getDbPool();
  if (!pool || !isDbConnected()) {
    return res.status(503).json({ success: false, error: 'Database is offline. Personnel was not created.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [matchingUsers]: any = await connection.query(
      `SELECT user_id, username, email, role
       FROM users
       WHERE user_id = ? OR LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)
       FOR UPDATE`,
      [userId, uName, uEmail]
    );

    if (matchingUsers.length > 1 || matchingUsers.some((user: any) => user.role !== 'Personnel')) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        error: 'The username, email, or user ID is already assigned to a different account.',
      });
    }

    if (matchingUsers.length === 1) {
      const existingUser = matchingUsers[0];
      userId = existingUser.user_id;
      uName = existingUser.username;
      uEmail = existingUser.email;
      await connection.query(
        'UPDATE users SET name = ?, password_hash = ? WHERE user_id = ?',
        [fName, pass, userId]
      );
    } else {
      await connection.query(
        `INSERT INTO users (user_id, username, email, password_hash, role, name)
         VALUES (?, ?, ?, ?, 'Personnel', ?)`,
        [userId, uName, uEmail, pass, fName]
      );
    }

    let [userRows]: any = await connection.query(
      'SELECT user_id, role FROM users WHERE user_id = ? FOR UPDATE',
      [userId]
    );
    if (!userRows.length) {
      await connection.query(
        `INSERT INTO users (user_id, username, email, password_hash, role, name)
         VALUES (?, ?, ?, ?, 'Personnel', ?)`,
        [userId, uName, uEmail, pass, fName]
      );
      [userRows] = await connection.query(
        'SELECT user_id, role FROM users WHERE user_id = ? FOR UPDATE',
        [userId]
      );
    }
    if (!userRows.length) {
      throw new Error(`Personnel user "${userId}" was not present after account creation.`);
    }
    if (userRows[0].role !== 'Personnel') {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        error: 'The user ID is already assigned to a different account role.',
      });
    }

    const [matchingPersonnel]: any = await connection.query(
      `SELECT personnel_id, user_id
       FROM personnel
       WHERE personnel_id = ? OR user_id = ? OR employee_number = ?
       FOR UPDATE`,
      [personnelId, userId, empNo]
    );

    if (matchingPersonnel.length > 1 || matchingPersonnel.some((person: any) => person.user_id !== userId)) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        error: 'The personnel ID or employee number is already assigned to another account.',
      });
    }

    if (matchingPersonnel.length === 1) {
      personnelId = matchingPersonnel[0].personnel_id;
      await connection.query(
        `UPDATE personnel
         SET employee_number = ?, full_name = ?, office = ?, position = ?,
             assigned_subject = ?, assigned_grade_level = ?, assigned_section = ?,
             is_department_head = ?, department_head_title = ?
         WHERE personnel_id = ?`,
        [empNo, fName, off, pos, subj, gLevel, sect, isDeptHead, pos, personnelId]
      );
    } else {
      await connection.query(
        `INSERT INTO personnel (personnel_id, user_id, employee_number, full_name, office, position, assigned_subject, assigned_grade_level, assigned_section, is_department_head, department_head_title)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [personnelId, userId, empNo, fName, off, pos, subj, gLevel, sect, isDeptHead, pos]
      );
    }

    await connection.commit();
    console.log(`✅ [MySQL] Successfully inserted personnel "${fName}" into database!`);
  } catch (err: any) {
    await connection.rollback();
    console.error('❌ [MySQL Personnel Insert Error]:', {
      message: err?.message || err,
      code: err?.code,
      userId,
      personnelId,
    });
    return res.status(500).json({
      success: false,
      error: `Failed to save personnel account${err?.message ? `: ${err.message}` : '.'}`,
    });
  } finally {
    connection.release();
  }

  const createdPersonnel = {
    personnel_id: personnelId,
    user_id: userId,
    employee_number: empNo,
    full_name: fName,
    office: off,
    position: pos,
    assigned_subject: subj,
    assigned_grade_level: gLevel,
    assigned_section: sect,
    username: uName,
    email: uEmail,
    is_department_head: isDeptHead,
    department_head_title: pos,
    status: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const createdUser = {
    user_id: userId,
    auth_user_id: `auth_${userId}`,
    name: fName,
    email: uEmail,
    role: 'Personnel',
    status: 1,
    created_at: createdPersonnel.created_at,
    updated_at: createdPersonnel.updated_at,
  };

  broadcastRealtimeEvent({
    type: 'PERSONNEL_CREATED',
    data: { user: createdUser, personnel: createdPersonnel },
  });

  return res.json({
    success: true,
    message: `Personnel "${fName}" provisioned and saved to MySQL successfully!`,
    user: createdUser,
    personnel: createdPersonnel,
  });
});

// Delete User from MySQL
app.delete('/api/users/:user_id', async (req: Request, res: Response) => {
  const { user_id } = req.params;
  if (user_id === 'usr_admin') {
    return res.status(403).json({ success: false, message: 'The administrator account cannot be deleted.' });
  }

  const pool = getDbPool();

  if (!pool || !isDbConnected()) {
    return res.status(503).json({ success: false, message: 'Database is offline. Account was not deleted.' });
  }

  try {
    const [rows]: any = await pool.query(
      'SELECT role FROM users WHERE user_id = ? LIMIT 1',
      [user_id]
    );
    if (rows[0]?.role === 'Administrator') {
      return res.status(403).json({ success: false, message: 'Administrator accounts cannot be deleted.' });
    }

    await pool.query('DELETE FROM users WHERE user_id = ?', [user_id]);
    console.log(`✅ [MySQL] User ${user_id} deleted from database.`);
  } catch (err: any) {
    console.error('❌ [MySQL User Delete Error]:', err?.message || err);
    return res.status(500).json({ success: false, message: 'Failed to delete user from database.' });
  }

  broadcastRealtimeEvent({
    type: 'USER_DELETED',
    data: { user_id },
  });

  return res.json({ success: true, message: `User ${user_id} deleted.` });
});

// 5. Teacher Signs Student Clearance (Real-Time Broadcast)
app.post('/api/clearance/sign', async (req: Request, res: Response) => {
  const { personnel_id, student_id } = req.body;

  if (!personnel_id || !student_id) {
    return res.status(400).json({ error: 'personnel_id and student_id are required' });
  }

  const pool = getDbPool();
  if (pool && isDbConnected()) {
    try {
      await pool.query(
        `UPDATE clearance_assignments SET status = 'Approved', signed_by_personnel_id = ?, signed_at = NOW() 
         WHERE student_id = ?`,
        [personnel_id, student_id]
      );
    } catch (err) {
      console.warn('[MySQL Save Error]:', err);
    }
  }

  // Broadcast instantly to all APKs and Web
  broadcastRealtimeEvent({
    type: 'SIGNATURE_UPDATED',
    data: {
      personnel_id,
      student_id,
      status: 'Approved',
      message: 'Clearance requirement approved and digitally signed.',
    },
  });

  return res.json({
    success: true,
    message: 'Signature recorded successfully and broadcasted in real-time.',
    student_id,
    status: 'Approved',
  });
});

// 6. Teacher Revokes / Undos Accidental Signature (Real-Time Broadcast)
app.post('/api/clearance/undo', async (req: Request, res: Response) => {
  const { personnel_id, student_id, reason } = req.body;

  if (!personnel_id || !student_id) {
    return res.status(400).json({ error: 'personnel_id and student_id are required' });
  }

  const pool = getDbPool();
  if (pool && isDbConnected()) {
    try {
      await pool.query(
        `UPDATE clearance_assignments SET status = 'With Remarks', remarks = ? 
         WHERE student_id = ?`,
        [reason || 'Nasipyat og sign - gibawi sa magtutudlo', student_id]
      );
    } catch (err) {
      console.warn('[MySQL Save Error]:', err);
    }
  }

  // Broadcast instantly to all APKs and Web
  broadcastRealtimeEvent({
    type: 'SIGNATURE_REVOKED',
    data: {
      personnel_id,
      student_id,
      status: 'With Remarks',
      reason: reason || 'Accidental signature reverted by teacher',
    },
  });

  return res.json({
    success: true,
    message: 'Signature revoked (Undo) and broadcasted in real-time.',
    student_id,
    status: 'With Remarks',
  });
});

// =========================================================================
// SERVER INITIALIZATION (Mounts Vite Middleware in Dev)
// =========================================================================
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.method} ${req.path} was not found. Restart the API server to load the latest routes.`,
  });
});

const startServer = async () => {
  await testDbConnection();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [SIA ClearPass] Full-Stack Server running at: http://localhost:${PORT}`);
    console.log(`📱 [Mobile APK Endpoint]: http://<YOUR_LOCAL_IP>:${PORT}/api`);
    console.log(`⚡ [Real-time Stream]: http://localhost:${PORT}/api/realtime/stream`);
  });
};

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
});