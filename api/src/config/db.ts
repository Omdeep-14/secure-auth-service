import { Pool } from "../../node_modules/@types/pg/index.js";
import { env } from "./env.js";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});
