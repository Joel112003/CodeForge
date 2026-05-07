export default function csrfProtection(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  if (req.path.startsWith("/api/auth/")) return next();

  const hasAuthHeader = Boolean(req.headers.authorization?.startsWith("Bearer "));
  const hasAuthCookie = Boolean(req.cookies?.access_token);

  // Enforce CSRF only for cookie-based auth
  if (!hasAuthCookie || hasAuthHeader) return next();

  const csrfCookie = req.cookies?.csrf_token;
  const csrfHeader = req.headers["x-csrf-token"];
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
    });
    res.clearCookie("csrf_token", {
      httpOnly: false,
      secure: isProd,
      sameSite: "lax",
    });
    return res.status(403).json({ message: "Invalid CSRF token" });
  }

  return next();
}
