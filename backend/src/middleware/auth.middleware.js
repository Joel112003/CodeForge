import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  const headerToken = req.headers["authorization"]?.split(" ")[1];
  const cookieToken = req.cookies?.access_token;
  const token = headerToken || cookieToken;
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};
