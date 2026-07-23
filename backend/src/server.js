import 'dotenv/config';

import app from '#app.js';
import { env } from '#config/env.js';
import { startReminderJobs, stopReminderJobs } from '#jobs/reminder.jobs.js';
import { logger } from '#lib/logger.js';
import { connectDatabase, disconnectDatabase } from '#lib/prisma.js';

async function startServer() {
  try {
    await connectDatabase();

    const server = app.listen(env.SERVER_PORT, () => {
      logger.info(`THABAT API running on port ${env.SERVER_PORT} [${env.NODE_ENV}]`);
      if (env.NODE_ENV !== 'test') {
        startReminderJobs();
      }
    });

    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      stopReminderJobs();
      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
