export function requireSession(req, res, next) {
  // If the user hasn't logged in, req.session.userId will be undefined.
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }
  // They are logged in, allow them to proceed to the route handler.
  next();
}
