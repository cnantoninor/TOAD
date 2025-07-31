"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./models/database");
const sessionRoutes_1 = __importDefault(require("./routes/sessionRoutes"));
const logger_1 = require("./utils/logger");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Security middleware
app.use((0, helmet_1.default)({
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
const limiter = (0, express_rate_limit_1.default)({
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
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com'] // Replace with your frontend domain
        : ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id']
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.Logger.logApiRequest(req.method, req.path, req.correlationId || 'unknown');
        logger_1.Logger.logApiResponse(res.statusCode, req.correlationId || 'unknown');
    });
    next();
});
// API routes
app.use('/api', sessionRoutes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
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
app.use((error, req, res, next) => {
    logger_1.Logger.error('Unhandled error', error, {
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
    logger_1.Logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger_1.Logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
// Initialize database and start server
async function startServer() {
    try {
        await (0, database_1.initializeDatabase)();
        logger_1.Logger.info('Database initialized successfully');
        app.listen(PORT, () => {
            logger_1.Logger.info(`Server running on port ${PORT}`, {
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                message: `🚀 TOAD Architect backend server started on port ${PORT}`
            });
            console.log(`🚀 TOAD Architect backend server started on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🔗 API base: http://localhost:${PORT}/api`);
        });
    }
    catch (error) {
        logger_1.Logger.error('Failed to start server', error);
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=server.js.map