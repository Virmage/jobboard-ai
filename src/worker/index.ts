import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";
import { handleScanJob } from "./scan-job";
import { handleCacheRebuild } from "./cache-rebuild-job";
import { handleExpireFeatures } from "./expire-features-job";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const QUEUE_NAME = "jobboard-worker";

// ---------------------------------------------------------------------------
// Redis connection
// ---------------------------------------------------------------------------

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
}) as any;

connection.on("connect", () => console.log("[worker] Redis connected"));
connection.on("error", (err: Error) => console.error("[worker] Redis error:", err.message));

// ---------------------------------------------------------------------------
// Queue + repeatable jobs
// ---------------------------------------------------------------------------

const queue = new Queue(QUEUE_NAME, { connection });

async function setupRepeatableJobs(): Promise<void> {
  // Remove old repeatable jobs to avoid duplicates on restart
  const existing = await queue.getRepeatableJobs();
  for (const job of existing) {
    await queue.removeRepeatableByKey(job.key);
  }

  // Scan: every 6 hours
  await queue.add(
    "scan",
    {},
    {
      repeat: { pattern: "0 */6 * * *" },
      removeOnComplete: { count: 10 },
      removeOnFail: { count: 20 },
    },
  );
  console.log("[worker] Registered repeatable job: scan (every 6h)");

  // Cache rebuild: every 7 days (Sundays at 3am)
  await queue.add(
    "cache-rebuild",
    {},
    {
      repeat: { pattern: "0 3 * * 0" },
      removeOnComplete: { count: 5 },
      removeOnFail: { count: 10 },
    },
  );
  console.log("[worker] Registered repeatable job: cache-rebuild (weekly Sun 3am)");

  // Expire features: every hour
  await queue.add(
    "expire-features",
    {},
    {
      repeat: { pattern: "0 * * * *" },
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 50 },
    },
  );
  console.log("[worker] Registered repeatable job: expire-features (every 1h)");
}

// ---------------------------------------------------------------------------
// Worker processor
// ---------------------------------------------------------------------------

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const startTime = Date.now();
    console.log(`\n[worker] Processing job: ${job.name} (id: ${job.id})`);

    switch (job.name) {
      case "scan":
        await handleScanJob();
        break;

      case "cache-rebuild":
        await handleCacheRebuild();
        break;

      case "expire-features":
        await handleExpireFeatures();
        break;

      default:
        console.warn(`[worker] Unknown job name: ${job.name}`);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[worker] Job ${job.name} completed in ${elapsed}s`);
  },
  {
    connection,
    concurrency: 1,
    limiter: {
      max: 1,
      duration: 1000,
    },
  },
);

worker.on("completed", (job) => {
  console.log(`[worker] Job ${job?.name} (${job?.id}) completed`);
});

worker.on("failed", (job, err) => {
  console.error(
    `[worker] Job ${job?.name} (${job?.id}) failed:`,
    err.message,
  );
});

worker.on("error", (err) => {
  console.error("[worker] Worker error:", err.message);
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`\n[worker] Received ${signal}, shutting down gracefully...`);

  try {
    await worker.close();
    console.log("[worker] Worker closed");
  } catch (err) {
    console.error("[worker] Error closing worker:", (err as Error).message);
  }

  try {
    await queue.close();
    console.log("[worker] Queue closed");
  } catch (err) {
    console.error("[worker] Error closing queue:", (err as Error).message);
  }

  try {
    connection.disconnect();
    console.log("[worker] Redis disconnected");
  } catch (err) {
    console.error("[worker] Error disconnecting Redis:", (err as Error).message);
  }

  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("[worker] JobBoard AI Worker starting...");
  console.log(`[worker] Redis URL: ${REDIS_URL.replace(/\/\/.*@/, "//***@")}`);
  console.log(`[worker] Queue: ${QUEUE_NAME}`);

  await setupRepeatableJobs();

  console.log("[worker] Worker is running. Waiting for jobs...\n");
}

main().catch((err) => {
  console.error("[worker] Fatal error:", err);
  process.exit(1);
});
