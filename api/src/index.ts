import dotenv from "dotenv/config";
import app from "./app.js";
import { env } from "./config/env.js";

console.log(env.PORT);

app.listen(env.PORT, () => {
  console.log(`server started on port ${env.PORT}`);
});
