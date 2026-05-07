import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again after 15 minutes",
  },
});

const executionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    error:
      "Too many code execution requests from this IP, please try again after an hour",
  },
});
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  keyGenerator: (req) => {
    const email = String(req.body?.email || "").toLowerCase().trim();
    const ipKey = ipKeyGenerator(req);
    return email ? `${ipKey}:${email}` : ipKey;
  },
  message: {
    error: "Too many login attempts, please try again in 10 minutes",
  },
});

const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // limit each IP to 5 registration attempts per windowMs
  message: {
    error: "Too many registration attempts, please try again in 10 minutes",
  },
});

export { apiLimiter, executionLimiter, loginLimiter, registerLimiter };
