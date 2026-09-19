require('dotenv').config();
const app = require('./src/app');
const prisma = require('./src/config/prisma');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify DB connectivity
    await prisma.$connect();
    console.log('✅ Connected to MySQL database via Prisma.');

    const server = app.listen(PORT, () => {
      console.log(`🚀 E-Commerce API server running at http://localhost:${PORT}`);
      console.log(`📡 Health check available at http://localhost:${PORT}/api/health`);
    });

    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('🔒 Database disconnected. Server closed cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
