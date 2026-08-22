import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index";
import * as path from "path";

async function run() {
  console.log("Running migrations...");
  try {
    const migrationsFolder = path.join(__dirname, "../migrations");
    console.log(`Loading migrations from ${migrationsFolder}...`);
    await migrate(db, { migrationsFolder });
    console.log("Migrations applied successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
