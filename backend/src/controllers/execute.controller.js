
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
  ]
);
    res.json({ message: "Execution successful", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Execution failed", error: err.message });
  }
};
