import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import pool from "../config/db.js";

function setAuthCookies(res, token) {
  const isProd = process.env.NODE_ENV === "production";
  const csrfToken = crypto.randomBytes(32).toString("hex");

  res.cookie("access_token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 60 * 60 * 1000,
  });

  res.cookie("csrf_token", csrfToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 60 * 60 * 1000,
  });

  return csrfToken;
}

function setCsrfCookie(res) {
  const isProd = process.env.NODE_ENV === "production";
  const csrfToken = crypto.randomBytes(32).toString("hex");

  res.cookie("csrf_token", csrfToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 60 * 60 * 1000,
  });

  return csrfToken;
}

function setRefreshCookie(res, refreshToken, maxAgeMs) {
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: maxAgeMs,
  });
}

async function createRefreshToken(userId) {
  const days = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7);
  const maxAgeMs = days * 24 * 60 * 60 * 1000;
  const refreshToken = crypto.randomBytes(64).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  const expiresAt = new Date(Date.now() + maxAgeMs);

  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, tokenHash, expiresAt],
  );

  return { refreshToken, maxAgeMs };
}

async function revokeRefreshToken(tokenHash) {
  await pool.query(
    "UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL",
    [tokenHash],
  );
}

export const register = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "User email already exists" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *",
      [email, passwordHash],
    );
    const token = jwt.sign(
      { userId: newUser.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
    const csrfToken = setAuthCookies(res, token);
    const { refreshToken, maxAgeMs } = await createRefreshToken(newUser.rows[0].id);
    setRefreshCookie(res, refreshToken, maxAgeMs);
    res.json({
      message: "Registration successful",
      token,
      csrfToken,
      user: {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  if (result.rows.length === 0) {
    return res.status(400).json({ message: "Invalid email" });
  }

  const valid = await bcrypt.compare(password, result.rows[0].password_hash);
  if (!valid) {
    return res.status(400).json({ message: "Invalid password" });
  }
  const token = jwt.sign(
    { userId: result.rows[0].id },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
  const csrfToken = setAuthCookies(res, token);
  const { refreshToken, maxAgeMs } = await createRefreshToken(result.rows[0].id);
  setRefreshCookie(res, refreshToken, maxAgeMs);
  res.json({
    message: "Login successful",
    token,
    csrfToken,
    user: {
      id: result.rows[0].id,
      email: result.rows[0].email,
    },
  });
};

export const me = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, email FROM users WHERE id = $1", [
      req.user.userId,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const csrfToken = setCsrfCookie(res);
    res.json({ user: result.rows[0], csrfToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  const refreshToken = req.cookies?.refresh_token;
  if (refreshToken) {
    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    await revokeRefreshToken(tokenHash);
  }
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });
  res.clearCookie("csrf_token", {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });
  res.json({ message: "Logged out" });
};

export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const result = await pool.query(
      "SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1",
      [tokenHash],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const record = result.rows[0];
    if (record.revoked_at || new Date(record.expires_at) <= new Date()) {
      return res.status(401).json({ message: "Refresh token expired" });
    }

    await revokeRefreshToken(tokenHash);

    const userResult = await pool.query(
      "SELECT id, email FROM users WHERE id = $1",
      [record.user_id],
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign(
      { userId: record.user_id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
    const csrfToken = setAuthCookies(res, token);
    const { refreshToken: nextRefreshToken, maxAgeMs } =
      await createRefreshToken(record.user_id);
    setRefreshCookie(res, nextRefreshToken, maxAgeMs);

    res.json({ user: userResult.rows[0], csrfToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
