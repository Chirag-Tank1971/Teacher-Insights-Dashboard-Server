const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.sub,
      role: payload.role,
      teacherId: payload.teacherId || null,
    };
    return next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("JWT verification failed", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireRole() {
  const roles = Array.from(arguments);

  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  };
}

module.exports = { requireAuth, requireRole };

