export async function register() {
  // Only run in Node.js runtime (not Edge) — better-sqlite3 requires native Node
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runMigrations } = await import("./lib/db/migrate");
    try {
      runMigrations();
      console.log("[instrumentation] Database migrations applied");
    } catch (err) {
      console.error("[instrumentation] Migration failed:", err);
      throw err;
    }
  }
}
