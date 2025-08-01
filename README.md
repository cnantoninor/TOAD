# TOAD Architect - Stage 1 MVP

A web-based conversational software architecture assistant that helps software engineers and architects design, plan, and iterate on software architectures through systematic trade-off analysis.

## 🚨 MVP Limitations & Important Notes

**This is a Minimum Viable Product (MVP) with specific limitations:**

### ⚠️ Critical Limitations
- **Session Persistence**: Sessions are automatically deleted after 30 days
- **Security**: No authentication/authorization - sessions are accessible via URL
- **Scalability**: Designed for 10 concurrent users initially
- **Database**: SQLite for simplicity (not recommended for high-scale production)
- **No Real-time Features**: Basic request/response only
- **Limited Error Handling**: Basic error responses without advanced recovery

### 📋 What's Included in Stage 1
- ✅ Basic conversational interface with AI agent
- ✅ Session management with GUID-based URLs
- ✅ File-based storage with SQLite database
- ✅ Basic export to Markdown with ADR generation
- ✅ Custom system instructions support
- ✅ Conversation summarization (after 20 messages)
- ✅ Input validation and XSS protection
- ✅ Structured logging with correlation IDs
- ✅ Rate limiting and security headers
- ✅ Comprehensive testing suite
- ✅ Session cleanup after 30 days

### 🔮 Future Stages
- **Stage 2**: Structured data management (SQAs, Options, Trade-off Matrix)
- **Stage 3**: Real-time features and performance optimization
- **Stage 4**: Production features and REST API
- **Stage 5**: Cloud deployment with auto-scaling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key
- Git

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd toad-architect
```

2. **Set up backend:**
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your OpenAI API key
npm run dev
```

3. **Set up frontend (in a new terminal):**
```bash
cd frontend
npm install
npm start
```

4. **Open the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

## 📋 Session Management

### Continuing Sessions

TOAD Architect supports session persistence, allowing you to continue conversations even after closing your browser:

#### Method 1: URL-Based Access
- When you create a new session, the URL automatically updates to include your session ID
- Example: `http://localhost:3000/session/123e4567-e89b-12d3-a456-426614174000`
- You can bookmark this URL or share it with others to continue the session later

#### Method 2: Session ID Entry
- Visit the home page at `http://localhost:3000`
- Enter your session ID in the "Continue Existing Session" field
- Click "Continue Session" to load your previous conversation

#### Method 3: Copy Session URL
- While in an active session, click the "Copy URL" button in the header
- This copies the full session URL to your clipboard
- You can paste this URL in a new browser tab or share it with others

### Session Features
- **Automatic Saving**: All conversations are automatically saved
- **30-Day Retention**: Sessions are kept for 30 days of inactivity
- **Export Capability**: Export conversations as Markdown files
- **No Authentication Required**: Sessions are accessible via session ID only

### Session Limitations
- Sessions are automatically cleaned up after 30 days of inactivity
- No user authentication - sessions are accessible to anyone with the session ID
- Maximum of 10 concurrent users (MVP limitation)

## 📁 Project Structure

```
toad-architect/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Validation, security
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utilities (logging)
│   │   └── scripts/        # Maintenance scripts
│   ├── data/               # SQLite database
│   ├── logs/               # Application logs
│   └── tests/              # Test files
├── frontend/               # React SPA
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API client
│   │   └── types/          # TypeScript types
│   └── public/             # Static assets
└── docs/                   # Documentation
```

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run cleanup      # Manual session cleanup
```

### Frontend Development
```bash
cd frontend
npm start            # Start development server
npm test             # Run tests
npm run build        # Build for production
```

### Testing
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Test coverage
cd backend && npm run test:coverage
```

## 📚 API Documentation

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions` | Create new session |
| GET | `/api/sessions/:id` | Get session by ID |
| POST | `/api/sessions/:id/messages` | Send message to AI |
| GET | `/api/sessions/:id/export` | Export session as Markdown |
| GET | `/health` | Health check |

### Example Usage

```bash
# Create a session
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"customInstructions": "Focus on microservices"}'

# Send a message
curl -X POST http://localhost:3001/api/sessions/{sessionId}/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "I need to design a scalable e-commerce platform"}'
```

## 🔒 Security Features

### Input Validation
- All inputs validated and sanitized
- XSS protection through input escaping
- Rate limiting (100 requests per 15 minutes per IP)
- Request size limits (10MB)

### Security Headers
- Helmet.js for security headers
- CORS configuration
- Content Security Policy
- Correlation IDs for request tracking

## 📊 Logging & Monitoring

### Log Files
- `backend/logs/combined.log` - All application logs
- `backend/logs/error.log` - Error logs only

### Log Levels
- `error` - Application errors
- `warn` - Warning conditions  
- `info` - General information
- `debug` - Debug information

### Correlation IDs
Every request gets a unique correlation ID for tracking across the system.

## 🧪 Testing Strategy

### Backend Tests
- **Unit Tests**: Individual components and services
- **Integration Tests**: API endpoints with real database
- **Mocked Tests**: OpenAI API calls are mocked

### Frontend Tests
- **Component Tests**: React components with React Testing Library
- **Integration Tests**: User workflows and API interactions
- **Mocked Tests**: API service calls are mocked

### Test Coverage
- Backend: >80% coverage target
- Frontend: >80% coverage target
- All critical paths tested

## 🔄 Session Management

### Session Lifecycle
1. **Creation**: New session with GUID-based URL
2. **Usage**: Conversation with AI agent
3. **Persistence**: Stored in SQLite database
4. **Cleanup**: Automatically deleted after 30 days

### Session Data
- Conversation history (JSON)
- Custom instructions
- Current phase tracking
- Conversation summary (after 20 messages)

## 🚀 Deployment

### Development
```bash
# Backend
cd backend && npm run dev

# Frontend  
cd frontend && npm start
```

### Production
```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build
# Deploy build/ directory to static hosting
```

### Environment Variables
See `backend/env.example` for all required environment variables.

## 🐛 Troubleshooting

### Common Issues

1. **OpenAI API Errors**
   - Check API key in `.env`
   - Verify API quota and billing
   - Check rate limits

2. **Database Errors**
   - Ensure `backend/data` directory exists
   - Check file permissions
   - Verify SQLite installation

3. **Port Conflicts**
   - Change `PORT` in `.env`
   - Kill existing processes

### Debug Mode
Set `LOG_LEVEL=debug` in backend `.env` for detailed logging.

## 📝 Development Notes

### Architecture Decisions
- **SQLite**: Simple deployment, good for MVP
- **File-based Storage**: Easy backup and inspection
- **GUID URLs**: Simple session management
- **Conversation Summarization**: Prevents context window overflow

### Performance Considerations
- Database queries optimized
- OpenAI API calls cached where possible
- Rate limiting prevents abuse
- Request/response logging for monitoring

### Code Quality
- TypeScript with strict mode
- Comprehensive error handling
- Input validation and sanitization
- Structured logging
- Test coverage requirements

## 🤝 Contributing

1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Ensure all tests pass
5. Consider MVP limitations

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs in `backend/logs/`
3. Check the health endpoint: `http://localhost:3001/health`
4. Verify environment variables are set correctly

---

**Remember**: This is an MVP with intentional limitations. For production use, consider implementing the features outlined in the technical architecture document for Stages 2-5. 