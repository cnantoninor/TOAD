import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initializeDatabase } from './models/database';
import sessionRoutes from './routes/sessionRoutes';
import { Logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com'] // Replace with your frontend domain
        : ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    res.on('finish', () => {
        Logger.logApiRequest(req.method, req.path, req.correlationId || 'unknown');
        Logger.logApiResponse(res.statusCode, req.correlationId || 'unknown');
    });

    next();
});

// API routes
app.use('/api', sessionRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: 'The requested resource does not exist',
        path: req.originalUrl
    });
});

// Global error handler
app.use((error: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    Logger.error('Unhandled error', error, {
        correlationId: req.correlationId,
        path: req.path,
        method: req.method
    });

    res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        correlationId: req.correlationId
    });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    Logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', async () => {
    Logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Initialize database and start server
async function startServer() {
    try {
        await initializeDatabase();
        Logger.info('Database initialized successfully');

        app.listen(PORT, () => {
            Logger.info(`Server running on port ${PORT}`, {
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                message: `🚀 TOAD Architect backend server started on port ${PORT}`
            });

            console.log(`🚀 TOAD Architect backend server started on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🔗 API base: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        Logger.error('Failed to start server', error as Error);
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer(); 