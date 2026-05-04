import executeCode from "../services/executionEngine.js";
import pool from "../config/db.js";

export const execute = async (req, res) => {
  const { language, code } = req.body;

  if (!["javascript", "python"].includes(language)) {
    return res.status(400).json({ message: "Unsupported language" });
  }

  if (!code || code.length > 10000) {
    return res.status(400).json({ message: "Invalid code" });
  }

  try {
    const result = await executeCode(language, code);
    // Store execution history in DB
    await pool.query(
      `INSERT INTO executions 
   (user_id, language, code, status, output, duration_ms)
   VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user.userId,
        language,
        code,
        "COMPLETED",
        result.output,
        result.duration,
      ],
    );
    res.json({ message: "Execution successful", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Execution failed", error: err.message });
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, language, code, status, output, duration_ms, created_at

        FROM executions WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.userId],
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const getExecutionById = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, language, code, status, output, duration_ms, created_at
       FROM executions WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.userId],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: "Execution not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};
