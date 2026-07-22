import app from './app.js';
import { initializeDatabase } from './config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Run DB migrations/initialization
    await initializeDatabase();

    // Start Express listener
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 Event Manager Backend server running on port ${PORT}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error('Fatal error starting the server:', err);
    process.exit(1);
  }
};

startServer();
