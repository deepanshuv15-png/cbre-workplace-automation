// demo-app/server.js
// A tiny fake "Workplace Facilities Helpdesk" used as the system under test.
// Data lives in memory, so every restart starts clean. Never use real data here.
const express = require('express');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- Synthetic test users (NOT real people) ----------
const USERS = {
  'facilities.user': { password: 'Password123', role: 'facilities', name: 'Facilities User' },
  'viewer.user': { password: 'Password123', role: 'viewer', name: 'Read-only Viewer' },
};

// ---------- Reference data ----------
const SITES = ['GXO Warehouse', 'London Office', 'Manchester Hub'];
const CATEGORIES = { Facilities: 'Facilities Team', IT: 'IT Service Desk', Security: 'Security Team' };
// Business rule: the warehouse has no on-site IT desk, so IT tickets are not allowed there.
const BLOCKED_COMBOS = [{ site: 'GXO Warehouse', category: 'IT' }];

// ---------- In-memory stores ----------
const sessions = new Map(); // sessionId -> username
const tickets = new Map(); // ticketId -> ticket
let counter = 1000;

// ---------- Helpers ----------
function parseCookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || '').split(';').filter(Boolean).map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, decodeURIComponent(v.join('='))];
    })
  );
}

// Works out who is calling: browser session cookie OR Basic auth header (used by API tests).
function currentUser(req) {
  const sid = parseCookies(req).sid;
  if (sid && sessions.has(sid)) {
    const username = sessions.get(sid);
    return { username, ...USERS[username] };
  }
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Basic ')) {
    const [username, password] = Buffer.from(auth.slice(6), 'base64').toString().split(':');
    if (USERS[username] && USERS[username].password === password) return { username, ...USERS[username] };
  }
  return null;
}

function requirePageLogin(req, res, next) {
  req.user = currentUser(req);
  if (!req.user) return res.redirect('/login');
  next();
}

function requireApiLogin(req, res, next) {
  req.user = currentUser(req);
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

function validateTicket({ category, site, description }) {
  const errors = [];
  if (!CATEGORIES[category]) errors.push('Category is required');
  if (!SITES.includes(site)) errors.push('Site is required');
  if (!description || !description.trim()) errors.push('Description is required');
  if (BLOCKED_COMBOS.some((b) => b.site === site && b.category === category)) {
    errors.push(`${category} tickets cannot be raised for ${site}`);
  }
  return errors;
}

// ---------- Pages ----------
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/', (_req, res) => res.redirect('/login'));
app.get('/login', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = USERS[username];
  if (!user || user.password !== password) return res.redirect('/login?error=1');
  const sid = crypto.randomUUID();
  sessions.set(sid, username);
  res.setHeader('Set-Cookie', `sid=${sid}; HttpOnly; Path=/; SameSite=Lax`);
  res.redirect('/dashboard');
});

app.post('/logout', (req, res) => {
  sessions.delete(parseCookies(req).sid);
  res.setHeader('Set-Cookie', 'sid=; Path=/; Max-Age=0');
  res.redirect('/login');
});

app.get('/dashboard', requirePageLogin, (_req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/tickets/:id', requirePageLogin, (_req, res) => res.sendFile(path.join(__dirname, 'public', 'ticket.html')));

// ---------- API ----------
app.get('/api/me', requireApiLogin, (req, res) => res.json({ username: req.user.username, name: req.user.name, role: req.user.role }));
app.get('/api/reference', (_req, res) => res.json({ sites: SITES, categories: Object.keys(CATEGORIES) }));

app.get('/api/tickets', requireApiLogin, (_req, res) => res.json([...tickets.values()].reverse()));

app.post('/api/tickets', requireApiLogin, (req, res) => {
  const { category, site, description, requestId } = req.body;
  const errors = validateTicket({ category, site, description });
  if (errors.length) return res.status(400).json({ errors });

  // Duplicate protection: the same requestId (one click of Submit) only ever creates one ticket.
  if (requestId) {
    const existing = [...tickets.values()].find((t) => t.requestId === requestId);
    if (existing) return res.status(200).json(existing);
  }

  const now = new Date().toISOString();
  const ticket = {
    id: `WP-${++counter}`,
    requestId: requestId || null,
    category,
    site,
    description: description.trim(),
    status: 'Open',
    assignedTeam: CATEGORIES[category], // REQ-003: auto-routing by category
    createdBy: req.user.username,
    createdAt: now,
    history: [{ at: now, by: req.user.username, text: 'Ticket created' }],
  };
  tickets.set(ticket.id, ticket);
  res.status(201).json(ticket);
});

app.get('/api/tickets/:id', requireApiLogin, (req, res) => {
  const t = tickets.get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Ticket not found' });
  res.json(t);
});

app.post('/api/tickets/:id/comments', requireApiLogin, (req, res) => {
  const t = tickets.get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Ticket not found' });
  if (t.status === 'Closed') return res.status(409).json({ error: 'Ticket is closed' });
  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ errors: ['Comment is required'] });
  t.history.push({ at: new Date().toISOString(), by: req.user.username, text });
  res.status(201).json(t);
});

app.patch('/api/tickets/:id', requireApiLogin, (req, res) => {
  const t = tickets.get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Ticket not found' });
  if (req.user.role !== 'facilities') return res.status(403).json({ error: 'Access denied' });

  const { status, assignedTeam } = req.body;
  if (status === 'Closed') {
    if (t.status === 'Closed') return res.status(409).json({ error: 'Ticket is already closed' });
    t.status = 'Closed';
    t.history.push({ at: new Date().toISOString(), by: req.user.username, text: 'Ticket closed' });
  } else if (status === 'In Progress') {
    t.status = 'In Progress';
  } else if (status) {
    return res.status(400).json({ errors: [`Unsupported status: ${status}`] });
  }
  if (assignedTeam) {
    t.assignedTeam = assignedTeam;
    t.history.push({ at: new Date().toISOString(), by: req.user.username, text: `Assigned to ${assignedTeam}` });
  }
  res.json(t);
});

// Test-only hook: lets a test simulate a backend outage (API returns 500).
app.get('/api/simulate-error', (_req, res) => res.status(500).json({ error: 'Internal Server Error' }));

app.use('/static', express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => console.log(`Demo helpdesk running at http://localhost:${PORT}`));
