import jwt from "jsonwebtoken"; // ✅ REQUIRED

export function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };
    next();
  } catch (err) {
    console.error("JWT ERROR:", err.message);
    res.status(401).json({ message: "Invalid token" });
  }
}
