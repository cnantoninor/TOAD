# TOAD Architect Backend

A Node.js/Express backend for the TOAD Architect conversational software architecture assistant.

## 🚨 MVP Limitations

**Important:** This is a Minimum Viable Product (MVP) with the following limitations:

- **Session Persistence**: Sessions are automatically deleted after 30 days
- **Security**: No authentication/authorization - sessions are accessible via URL
- **Scalability**: Designed for 10 concurrent users initially
- **Database**: SQLite for simplicity (not recommended for high-scale production)
- **No Real-time Features**: Basic request/response only
- **Limited Error Handling**: Basic error responses without advanced recovery

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key

### Installation

1. **Clone and install dependencies:**
```bash
cd backend
npm install
```

2. **Set up environment variables:**
```bash
cp env.example .env
# Edit .env with your OpenAI API key and other settings
```

3. **Start development server:**
```bash
npm run dev
```

The server will start on `http://localhost:3001`

## 📋 Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7

# Database Configuration
DB_PATH=./data/sessions.db

# Session Configuration
SESSION_CLEANUP_DAYS=30

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run cleanup` - Run session cleanup manually

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Endpoints

#### Create Session
```http
POST /sessions
Content-Type: application/json

{
  "customInstructions": "Optional custom instructions for the AI"
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "lastAccessed": "2024-01-15T10:00:00.000Z",
  "currentPhase": 1,
  "customInstructions": "Optional instructions",
  "conversationHistory": []
}
```

#### Get Session
```http
GET /sessions/{sessionId}
```

#### Send Message
```http
POST /sessions/{sessionId}/messages
Content-Type: application/json

{
  "content": "Your message to the AI"
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "message": {
    "id": "message-id",
    "timestamp": "2024-01-15T10:00:00.000Z",
    "role": "assistant",
    "content": "AI response"
  },
  "conversationHistory": [...]
}
```

#### Export Session
```http
GET /sessions/{sessionId}/export
```

Returns a Markdown file with the complete conversation history.

#### Health Check
```http
GET /health
```

## 🗄️ Database Schema

### Sessions Table
```sql
CREATE TABLE sessions (
  sessionId TEXT PRIMARY KEY,
  createdAt TEXT NOT NULL,
  lastAccessed TEXT NOT NULL,
  currentPhase INTEGER DEFAULT 1,
  customInstructions TEXT,
  conversationHistory TEXT,
  summary TEXT
);
```

## 🔒 Security Features

### Input Validation
- All inputs are validated and sanitized
- XSS protection through input escaping
- Rate limiting (100 requests per 15 minutes per IP)
- Request size limits (10MB)

### Headers
- Helmet.js for security headers
- CORS configuration
- Content Security Policy

## 📊 Logging

Structured logging with Winston:
- **File logs**: `./logs/combined.log` and `./logs/error.log`
- **Console logs**: In development mode
- **Correlation IDs**: Track requests across the system

### Log Levels
- `error` - Application errors
- `warn` - Warning conditions
- `info` - General information
- `debug` - Debug information

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Individual components and services
- **Integration Tests**: API endpoints with real database
- **Mocked Tests**: OpenAI API calls are mocked

## 🔄 Session Cleanup

Sessions are automatically cleaned up after 30 days (configurable via `SESSION_CLEANUP_DAYS`).

### Manual Cleanup
```bash
npm run cleanup
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Configure proper CORS origins
- Set up proper logging
- Configure database path

### Recommended Production Setup
- Use a proper database (PostgreSQL, MySQL)
- Set up reverse proxy (Nginx)
- Configure SSL/TLS
- Set up monitoring and alerting
- Implement proper backup strategy

## 🐛 Troubleshooting

### Common Issues

1. **OpenAI API Errors**
   - Check your API key in `.env`
   - Verify API quota and billing
   - Check rate limits

2. **Database Errors**
   - Ensure `./data` directory exists
   - Check file permissions
   - Verify SQLite installation

3. **Port Already in Use**
   - Change `PORT` in `.env`
   - Kill existing process: `lsof -ti:3001 | xargs kill`

### Debug Mode
Set `LOG_LEVEL=debug` in `.env` for detailed logging.

## 📝 Development Notes

### Architecture
- **Models**: Database operations and business logic
- **Controllers**: Request handling and response formatting
- **Services**: External API integrations (OpenAI)
- **Middleware**: Validation, security, logging
- **Routes**: API endpoint definitions

### Code Style
- TypeScript with strict mode
- ESLint configuration
- Prettier formatting
- Comprehensive error handling

### Performance Considerations
- Database queries are optimized
- OpenAI API calls are cached where possible
- Rate limiting prevents abuse
- Request/response logging for monitoring

## 🤝 Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure all tests pass

## 📄 License

MIT License - see LICENSE file for details. 