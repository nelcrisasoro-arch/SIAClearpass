import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { timingSafeEqual } from 'node:crypto';
import { getDbPool, testDbConnection, isDbConnected } from './src/server/db';
import { createSession, getSession, hashPassword, revokeSession, verifyPassword } from './src/server/security';

dotenv.config();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
const PORT = Number(process.env.PORT) || 3000;
const stateTable = 'clearpass_app_state';
let stateTableSetup: Promise<void> | null = null;

const ensureBootstrapAdmin = async () => {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const email = process.env.ADMIN_EMAIL?.trim() || 'admin@sia.edu.ph';
  if (!username || !password || password.length < 8) {
    throw new Error('Set ADMIN_USERNAME and ADMIN_PASSWORD (at least 8 characters) in the hosting secrets before starting.');
  }
  const pool = getDbPool();
  if (!pool || !isDbConnected()) throw new Error('MySQL is required in production.');
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(64) PRIMARY KEY, username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL, name VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
  const passwordHash = await hashPassword(password);
  const [matches]: any = await pool.query(
    'SELECT user_id, role FROM users WHERE username = ? OR email = ?',
    [username, email]
  );
  if (matches.length > 1) throw new Error('ADMIN_USERNAME and ADMIN_EMAIL must belong to the same account.');
  if (matches.length === 1) {
    if (matches[0].role !== 'Administrator') {
      throw new Error('The configured admin username or email is already assigned to a non-admin account.');
    }
    await pool.query(
      'UPDATE users SET username = ?, email = ?, password_hash = ?, name = ?, is_active = TRUE WHERE user_id = ?',
      [username, email, passwordHash, 'SIA ClearPass Administrator', matches[0].user_id]
    );
    return;
  }
  await pool.query(
    'INSERT INTO users (user_id, username, email, password_hash, role, name) VALUES (?, ?, ?, ?, \'Administrator\', ?)',
    ['usr_admin', username, email, passwordHash, 'SIA ClearPass Administrator']
  );
};

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

const ensurePushTables = async () => {
  const pool = await ensureStateTable();
  await pool.query(`CREATE TABLE IF NOT EXISTS clearpass_push_tokens (
    token VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_clearpass_push_user (user_id)
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS clearpass_push_outbox (
    notification_id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    title VARCHAR(180) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_clearpass_push_pending (status, created_at),
    INDEX idx_clearpass_push_user (user_id)
  )`);
  return pool;
};

const deliverPendingPushNotifications = async () => {
  try {
    if (!getDbPool() || !isDbConnected()) return;
    const pool = await ensurePushTables();
    await pool.query(
      `UPDATE clearpass_push_outbox SET status = 'pending'
       WHERE status = 'sending' AND updated_at < CURRENT_TIMESTAMP - INTERVAL 5 MINUTE`
    );
    const [pending]: any = await pool.query(
      `SELECT notification_id, user_id, title, message
       FROM clearpass_push_outbox
       WHERE status = 'pending'
       ORDER BY created_at ASC LIMIT 25`
    );

    for (const notification of pending) {
      const [tokenRows]: any = await pool.query(
        'SELECT token FROM clearpass_push_tokens WHERE user_id = ?',
        [notification.user_id]
      );
      if (!tokenRows.length) continue;

      const [claim]: any = await pool.query(
        `UPDATE clearpass_push_outbox SET status = 'sending', attempts = attempts + 1
         WHERE notification_id = ? AND status = 'pending'`,
        [notification.notification_id]
      );
      if (!claim.affectedRows) continue;

      try {
        const messages = tokenRows.map((row: { token: string }) => ({
          to: row.token,
          sound: 'default',
          title: String(notification.title).slice(0, 180),
          body: String(notification.message).slice(0, 1800),
          priority: 'high',
          channelId: 'clearance-updates',
          data: { notificationId: notification.notification_id },
        }));
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(messages),
        });
        if (!response.ok) throw new Error(`Expo push returned HTTP ${response.status}.`);
        const result: any = await response.json();
        const tickets = Array.isArray(result?.data) ? result.data : [result?.data];
        const invalidTokens = tickets
          .filter((ticket: any) => ticket?.details?.error === 'DeviceNotRegistered')
          .map((ticket: any) => messages[tickets.indexOf(ticket)]?.to)
          .filter(Boolean);
        if (invalidTokens.length) {
          for (const invalidToken of invalidTokens) {
            await pool.query('DELETE FROM clearpass_push_tokens WHERE token = ?', [invalidToken]);
          }
        }
        await pool.query(
          `UPDATE clearpass_push_outbox SET status = 'sent' WHERE notification_id = ?`,
          [notification.notification_id]
        );
      } catch (error) {
        await pool.query(
          `UPDATE clearpass_push_outbox SET status = 'pending' WHERE notification_id = ?`,
          [notification.notification_id]
        );
        console.error('[Expo push delivery error]:', error instanceof Error ? error.message : 'unknown');
      }
    }
  } catch (error) {
    console.error('[Expo push queue error]:', error instanceof Error ? error.message : 'unknown');
  }
};

setInterval(() => { void deliverPendingPushNotifications(); }, 60000);

const enqueuePushNotifications = async (notifications: any[]) => {
  if (!notifications.length) return;
  const pool = await ensurePushTables();
  for (const notification of notifications) {
    if (!notification?.notification_id || !notification?.user_id) continue;
    await pool.query(
      `INSERT IGNORE INTO clearpass_push_outbox (notification_id, user_id, title, message)
       VALUES (?, ?, ?, ?)`,
      [
        String(notification.notification_id).slice(0, 100),
        String(notification.user_id).slice(0, 64),
        String(notification.title || 'SIA ClearPass').slice(0, 180),
        String(notification.message || ''),
      ]
    );
  }
  await deliverPendingPushNotifications();
};

const allowedOrigins = new Set((process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',').map((origin) => origin.trim()).filter(Boolean));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || /^https:\/\/[a-z0-9-]+\.onrender\.com$/i.test(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

type AuthRequest = Request & { identity?: { userId: string; role: string } };
const loginAttempts = new Map<string, { count: number; resetAt: number }>;
app.use('/api', (req: AuthRequest, res: Response, next) => {
  if (req.path === '/health' || req.path === '/auth/login') return next();
  const bearer = req.header('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = bearer || (req.path === '/realtime/stream' ? String(req.query.ticket || '') : '');
  const identity = getSession(token);
  if (!identity) return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
  const adminRoutes = ['/students', '/personnel', '/users'];
  if (adminRoutes.some((route) => req.path === route || req.path.startsWith(`${route}/`)) && identity.role !== 'Administrator') {
    return res.status(403).json({ success: false, message: 'Administrator access is required.' });
  }
  if ((req.path === '/clearance/sign' || req.path === '/clearance/undo') && identity.role !== 'Personnel') {
    return res.status(403).json({ success: false, message: 'Personnel access is required for clearance signatures.' });
  }
  req.identity = identity;
  return next();
});

// =========================================================================
// REAL-TIME EVENT STREAM (Server-Sent Events / SSE)
// Connects Android APKs and Admin Web for Instant Multi-Device Sync!
// =========================================================================
const sseClients = new Map<Response, { userId: string; role: string }>();

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
  sseClients.forEach((identity, client) => {
    if ((event.type === 'STUDENT_CREATED' || event.type === 'PERSONNEL_CREATED' || event.type === 'USER_DELETED')
      && identity.role !== 'Administrator') return;
    try {
      client.write(`data: ${JSON.stringify({ ...event, timestamp: new Date().toISOString() })}\n\n`);
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
  });

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Real-time sync established with SIA ClearPass Server' })}\n\n`);
  const identity = (req as AuthRequest).identity;
  if (!identity) return res.end();
  sseClients.set(res, identity);

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

app.post('/api/push/register', async (req: AuthRequest, res: Response) => {
  const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
  if (!token || token.length > 255 || !/^(Expo|Exponent)PushToken\[.+\]$/.test(token)) {
    return res.status(400).json({ success: false, message: 'A valid Expo push token is required.' });
  }

  try {
    const pool = await ensurePushTables();
    await pool.query(
      `INSERT INTO clearpass_push_tokens (token, user_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), updated_at = CURRENT_TIMESTAMP`,
      [token, req.identity?.userId]
    );
    void deliverPendingPushNotifications();
    return res.json({ success: true });
  } catch (error) {
    console.error('[Push token registration error]:', error instanceof Error ? error.message : 'unknown');
    return res.status(503).json({ success: false, message: 'Could not register this device for notifications.' });
  }
});

app.delete('/api/push/register', async (req: AuthRequest, res: Response) => {
  try {
    const pool = await ensurePushTables();
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    if (token) {
      await pool.query('DELETE FROM clearpass_push_tokens WHERE user_id = ? AND token = ?', [req.identity?.userId, token]);
    } else {
      await pool.query('DELETE FROM clearpass_push_tokens WHERE user_id = ?', [req.identity?.userId]);
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('[Push token removal error]:', error instanceof Error ? error.message : 'unknown');
    return res.status(503).json({ success: false, message: 'Could not remove this device notification registration.' });
  }
});

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
    let state = rows[0] ? JSON.parse(rows[0].state_json) : null;
    if (!state) {
      const [admins]: any = await pool.query(
        `SELECT user_id, username, email, name, role, is_active AS status, created_at, updated_at
         FROM users WHERE role = 'Administrator' AND is_active = TRUE ORDER BY created_at ASC LIMIT 1`
      );
      state = {
        users: admins.map((user: any) => ({ ...user, auth_user_id: `auth_${user.user_id}` })),
        students: [], personnel: [], clearanceForms: [], clearancePeriods: [], signatories: [],
        requirements: [], assignments: [], submissions: [], records: [], signatures: [], notifications: [],
      };
    }
    return res.json({ success: true, state, updated_at: rows[0]?.updated_at ?? null });
  } catch (err: any) {
    console.error('[MySQL GET /api/state error]:', err?.message || err);
    return res.status(503).json({ success: false, message: 'Could not load shared application data from the database.' });
  }
});

app.put('/api/state', async (req: AuthRequest, res: Response) => {
  const state = req.body?.state;
  const source = String(req.body?.source || '');
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return res.status(400).json({ success: false, message: 'A valid application state object is required.' });
  }

  try {
    const pool = await ensureStateTable();
    const [previousRows]: any = await pool.query(
      `SELECT state_json FROM ${stateTable} WHERE state_key = 'main' LIMIT 1`
    );
    const previousState = previousRows[0]?.state_json ? JSON.parse(previousRows[0].state_json) : null;
    const previousNotificationIds = new Set(
      (Array.isArray(previousState?.notifications) ? previousState.notifications : [])
        .map((item: any) => item?.notification_id)
        .filter(Boolean)
    );
    const newNotifications = previousState
      ? (Array.isArray(state.notifications) ? state.notifications : [])
        .filter((item: any) => item?.notification_id && !previousNotificationIds.has(item.notification_id))
      : [];
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
    void enqueuePushNotifications(newNotifications).catch((error) => {
      console.error('[Push notification enqueue error]:', error instanceof Error ? error.message : 'unknown');
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
  const pass = typeof password === 'string' ? password : '';
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const nowMs = Date.now();
  const attempts = loginAttempts.get(ip);
  if (attempts && attempts.resetAt > nowMs && attempts.count >= 10) {
    return res.status(429).json({ success: false, message: 'Too many login attempts. Please wait 15 minutes.' });
  }

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
        const requestedRoles = req.body?.expectedRole
          ? (Array.isArray(req.body.expectedRole) ? req.body.expectedRole : [req.body.expectedRole])
          : null;
        if (requestedRoles && !requestedRoles.includes(found.role)) {
          return res.status(401).json({ success: false, message: 'Invalid login credentials for the selected role.' });
        }
        const storedHash = String(found.password_hash || '');
        const isHashed = storedHash.startsWith('scrypt$');
        const validPassword = isHashed
          ? await verifyPassword(pass, storedHash)
          : pass.length > 0 && storedHash.length === pass.length && timingSafeEqual(Buffer.from(storedHash), Buffer.from(pass));
        if (validPassword && found.is_active !== false && found.is_active !== 0) {
          if (!isHashed) {
            await pool.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [await hashPassword(pass), found.user_id]);
          }
          loginAttempts.delete(ip);
          const sessionToken = createSession(String(found.user_id), String(found.role));
          return res.json({
            success: true,
            sessionToken,
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
      console.error('[Auth] Login service error:', err instanceof Error ? err.message : 'unknown');
    }
  }

  const current = loginAttempts.get(ip);
  loginAttempts.set(ip, current && current.resetAt > nowMs
    ? { count: current.count + 1, resetAt: current.resetAt }
    : { count: 1, resetAt: nowMs + 15 * 60 * 1000 });

  return res.status(401).json({
    success: false,
    message: 'Invalid credentials. Please verify your username and password.',
  });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = req.header('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  revokeSession(token);
  return res.json({ success: true });
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

  const lrn = String(req.body.student_number || req.body.studentNumber || req.body.lrn || '').trim();
  const fName = String(req.body.first_name || req.body.firstName || '').trim();
  const mName = String(req.body.middle_name || req.body.middleName || '').trim();
  const lName = String(req.body.last_name || req.body.lastName || '').trim();
  const suf = String(req.body.suffix || '').trim();
  const rawLevel = String(req.body.school_level || req.body.schoolLevel || '');
  const rawGrade = String(req.body.grade_level || req.body.gradeLevel || 'Grade 9');
  const sect = String(req.body.section || 'Rose');
  const sYear = String(req.body.school_year || req.body.schoolYear || '2026-2027');
  const uName = lrn;
  const uEmail = `${lrn}@students.sia.edu.ph`;
  const pass = lrn.slice(-4);
  if (!/^\d{12}$/.test(lrn)) return res.status(400).json({ success: false, error: 'Enter a valid 12-digit LRN.' });
  const passwordHash = await hashPassword(pass);

  if (!fName || !lName || !lrn) {
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
    // Keep student credentials automatic: username is the LRN, password is its last 4 digits.
    const [existingStudents]: any = await pool.query(
      `SELECT student_id, user_id FROM students WHERE student_number = ? LIMIT 1`,
      [lrn]
    );
    if (existingStudents && existingStudents.length > 0) {
      finalStudentId = existingStudents[0].student_id;
      finalUserId = existingStudents[0].user_id;
    }

    // 1. Reuse an existing student account, but never take over Personnel/Admin credentials.
    const [existingUsers]: any = await pool.query(
      `SELECT user_id, role, username FROM users
       WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?) OR user_id = ?`,
      [uName, uEmail, finalUserId]
    );

    if (existingUsers && existingUsers.length > 0) {
      const existing = existingUsers.find((user: any) => user.user_id === finalUserId) || existingUsers[0];
      if (existingUsers.some((user: any) => user.user_id !== existing.user_id)) {
        return res.status(409).json({ success: false, error: 'The LRN is already assigned to another account.' });
      }
      if (existing.role !== 'Student') {
        return res.status(409).json({ success: false, error: 'The LRN is already assigned to a non-student account.' });
      }
      finalUserId = existing.user_id;
      await pool.query(
        `UPDATE users SET username = ?, email = ?, name = ?, password_hash = ? WHERE user_id = ?`,
        [uName, uEmail, fullName, passwordHash, finalUserId]
      );
    } else {
      // Brand new user
      await pool.query(
        `INSERT INTO users (user_id, username, email, password_hash, role, name)
         VALUES (?, ?, ?, ?, 'Student', ?)`,
        [finalUserId, uName, uEmail, passwordHash, fullName]
      );
    }

    if (existingStudents && existingStudents.length > 0) {
      await pool.query(
        `UPDATE students 
           SET user_id = ?, first_name = ?, middle_name = ?, last_name = ?, suffix = ?, school_level = ?, grade_level = ?, section = ?, school_year = ?
           WHERE student_id = ?`,
        [finalUserId, fName, mName, lName, suf, sLevel, rawGrade, sect, sYear, finalStudentId]
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
    console.error('[MySQL] Student create failed:', err instanceof Error ? err.message : 'unknown error');
    return res.status(500).json({ error: 'Failed to create student account.' });
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

  const empNo = String(req.body.employee_number || req.body.employeeNumber || '').trim();
  const fName = String(req.body.full_name || req.body.fullName || req.body.name || '').trim();
  const off = String(req.body.office || 'Academic Faculty').trim();
  const pos = String(req.body.position || 'Teacher & Signatory').trim();
  const subj = String(req.body.assigned_subject || req.body.assignedSubject || 'General Academics').trim();
  const gLevel = String(req.body.assigned_grade_level || req.body.assignedGradeLevel || 'Grade 9').trim();
  const sect = String(req.body.assigned_section || req.body.assignedSection || 'All Sections').trim();
  let uName = String(req.body.username || '').trim() || fName.toLowerCase().replace(/\s+/g, '.');
  let uEmail = String(req.body.email || '').trim() || `${uName}@sia.edu.ph`;
  const pass = String(req.body.password || '');
  if (pass.length < 12) return res.status(400).json({ success: false, error: 'Set a temporary password with at least 12 characters.' });
  const passwordHash = await hashPassword(pass);

  if (!fName || !empNo) {
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
        [fName, passwordHash, userId]
      );
    } else {
      await connection.query(
        `INSERT INTO users (user_id, username, email, password_hash, role, name)
         VALUES (?, ?, ?, ?, 'Personnel', ?)`,
        [userId, uName, uEmail, passwordHash, fName]
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
        [userId, uName, uEmail, passwordHash, fName]
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
      error: 'Failed to save personnel account.',
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
  if (!pool || !isDbConnected()) return res.status(503).json({ success: false, message: 'Database unavailable.' });
  const identity = (req as AuthRequest).identity;
  const [staffRows]: any = await pool.query('SELECT personnel_id FROM personnel WHERE user_id = ? LIMIT 1', [identity?.userId]);
  if (!staffRows.length || staffRows[0].personnel_id !== personnel_id) {
    return res.status(403).json({ success: false, message: 'You may only sign clearance as your own personnel account.' });
  }
  try {
    const [result]: any = await pool.query(
      `UPDATE clearance_assignments SET status = 'Approved', signed_by_personnel_id = ?, signed_at = NOW()
       WHERE student_id = ?`,
      [personnel_id, student_id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'No clearance items were found for this student.' });
  } catch (err) {
    console.error('[MySQL] Clearance signature failed:', err instanceof Error ? err.message : 'unknown error');
    return res.status(500).json({ success: false, message: 'Could not save clearance signature.' });
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
  if (!pool || !isDbConnected()) return res.status(503).json({ success: false, message: 'Database unavailable.' });
  const identity = (req as AuthRequest).identity;
  const [staffRows]: any = await pool.query('SELECT personnel_id FROM personnel WHERE user_id = ? LIMIT 1', [identity?.userId]);
  if (!staffRows.length || staffRows[0].personnel_id !== personnel_id) {
    return res.status(403).json({ success: false, message: 'You may only change signatures as your own personnel account.' });
  }
  try {
    const [result]: any = await pool.query(
      `UPDATE clearance_assignments SET status = 'With Remarks', remarks = ?
       WHERE student_id = ? AND signed_by_personnel_id = ?`,
      [reason || 'Nasipyat og sign - gibawi sa magtutudlo', student_id, personnel_id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'No signature by this personnel account was found.' });
  } catch (err) {
    console.error('[MySQL] Signature revocation failed:', err instanceof Error ? err.message : 'unknown error');
    return res.status(500).json({ success: false, message: 'Could not revoke clearance signature.' });
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
  if (process.env.NODE_ENV === 'production') await ensureBootstrapAdmin();

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
