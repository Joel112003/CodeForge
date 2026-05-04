const SUPPORTED_LANGUAGES = ["python", "javascript"];
const MAX_CODE_LENGTH = 1000;

export default function validateExecution(req, res, next) {
  const { language, code } = req.body;

  if (!language || !SUPPORTED_LANGUAGES.includes(language)) {
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
}
