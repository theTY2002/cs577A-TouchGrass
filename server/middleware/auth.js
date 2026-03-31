const { getSession } = require('../auth/sessionStore');
const { getUserById } = require('../auth/authService');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'Missing authorization token' });

  const session = getSession(token);
  if (!session) return res.status(401).json({ error: 'Invalid or expired session' });

  const user = await getUserById(session.userId);
  if (!user) return res.status(401).json({ error: 'Session user no longer exists' });

  req.authToken = token;
  req.user = user;
  next();
}

module.exports = { requireAuth };
