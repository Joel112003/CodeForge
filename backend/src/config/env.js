const required = [
  "PORT",
  "REDIS_URL",
  "JWT_SECRET",
  "CLIENT_URL",
  "DATABASE_URL",
];

export default function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
    missing.forEach((key) => {
      console.error(`  - ${key}`);
    });
    process.exit(1);
  }
}
