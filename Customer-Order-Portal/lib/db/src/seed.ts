/** CLI wrapper — `pnpm --filter @workspace/db run seed`. Logic lives in seed-data.ts. */
import { runSeed } from "./seed-data.js";

runSeed({ rounds: 12 })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
