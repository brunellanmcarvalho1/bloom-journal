import dotenv from "dotenv";

import { connectToDatabase } from "../src/config/database.js";
import { app } from "../src/app.js";

dotenv.config();

export default async function handler(req, res) {
  await connectToDatabase();
  return app(req, res);
}
