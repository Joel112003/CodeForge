import dotenv from "dotenv";
dotenv.config();

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false, sslmode: "require" }
    : false,

  
  max: 5,                  
  idleTimeoutMillis: 10000,  
  connectionTimeoutMillis: 5000, 
});


pool.on("error", (err) => {
  console.error("[db] idle client error — connection will be replaced automatically:", err.message);
});

pool.connect()
  .then((client) => {
    console.log("Connected to the database");
    client.release();
  })
  .catch((err) => console.error("Error connecting to the database", err));

export default pool;