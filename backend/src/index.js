import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/env.js';
import { testConnection, syncDatabase } from './config/database.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors(config.cors));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
}

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '학원 관리 시스템 API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            students: '/api/students',
            consultations: '/api/consultations',
            health: '/api/health'
        }
    });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        // Test database connection
        const isConnected = await testConnection();

        if (!isConnected) {
            console.error('❌ Failed to connect to database. Exiting...');
            process.exit(1);
        }

        // Sync database (create tables)
        // Set force: true to drop existing tables (only for development!)
        await syncDatabase(false);

        // Start listening
        const PORT = config.port;
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🎓 학원 관리 시스템 API Server                        ║
║                                                        ║
║   Environment: ${config.nodeEnv.padEnd(39)} ║
║   Port:        ${PORT.toString().padEnd(39)} ║
║   Database:    Connected ✅                            ║
║                                                        ║
║   API Docs:    http://localhost:${PORT}/api/health       ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
      `);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
