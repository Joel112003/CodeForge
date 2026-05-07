import { normalizeLanguage, SUPPORTED_LANGUAGES } from "../services/executionEngine.js";

const MAX_CODE_LENGTH = 10000;

export default function validateExecution(req, res, next) {
  const { language, code } = req.body;
  const normalizedLanguage = normalizeLanguage(language);

  if (!normalizedLanguage || !SUPPORTED_LANGUAGES.includes(normalizedLanguage)) {
    return res
      .status(400)
      .json({
        error: "Languages must be one of: " + SUPPORTED_LANGUAGES.join(", "),
      });
  }

  if (!code || typeof code !== "string" || code.length > MAX_CODE_LENGTH) {
    return res
      .status(400)
      .json({
        error: "Code must be a string with max length of " + MAX_CODE_LENGTH,
      });
  }

  req.body.language = normalizedLanguage;
  return next();
}
