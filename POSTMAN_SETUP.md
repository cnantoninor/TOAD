# TOAD Backend API - Postman Collection

This directory contains a complete Postman collection for testing the TOAD (The Open Architecture Designer) backend APIs.

## Files Included

- `TOAD_Backend_API.postman_collection.json` - Main API collection
- `TOAD_Backend_Environment.postman_environment.json` - Environment variables
- `POSTMAN_SETUP.md` - This setup guide

## Quick Start

### 1. Import the Collection

1. Open Postman
2. Click **Import** button
3. Select the `TOAD_Backend_API.postman_collection.json` file
4. The collection will be imported with all endpoints

### 2. Import the Environment

1. In Postman, go to **Environments** tab
2. Click **Import** button
3. Select the `TOAD_Backend_Environment.postman_environment.json` file
4. Select the imported environment from the dropdown

### 3. Start Your Backend Server

```bash
cd backend
npm install
npm run dev
```

The server will start on `http://localhost:3001` by default.

## API Endpoints

### Health Checks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic server health check |
| GET | `/api/health` | Detailed API health check with service status |

### Session Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions` | Create a new conversation session |
| GET | `/api/sessions/:sessionId` | Retrieve a specific session |
| POST | `/api/sessions/:sessionId/messages` | Send a message to the AI assistant |
| GET | `/api/sessions/:sessionId/export` | Export session as Markdown |

## Usage Workflow

### 1. Health Check
Start by testing the health endpoints to ensure your backend is running:

1. Run **Health Check** request
2. Run **API Health Check** request
3. Verify both return status 200

### 2. Create a Session
Create a new conversation session:

1. Run **Create Session** request
2. Optionally modify the `customInstructions` in the request body
3. Copy the `sessionId` from the response
4. Set the `sessionId` variable in your environment

### 3. Send Messages
Interact with the AI assistant:

1. Run **Send Message** request
2. Modify the `content` in the request body
3. The AI will respond based on conversation context

### 4. Get Session Details
Retrieve session information:

1. Run **Get Session** request
2. View conversation history and metadata

### 5. Export Session
Export the conversation:

1. Run **Export Session** request
2. The response will be a Markdown file download

## Environment Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `baseUrl` | Backend server URL | `http://localhost:3001` |
| `sessionId` | Current session ID | (empty) |
| `correlationId` | Request correlation ID | (auto-generated) |
| `environment` | Environment name | `development` |

## Request Examples

### Create Session
```json
{
  "customInstructions": "Create a modern web application with React and Node.js. Focus on scalability and performance."
}
```

### Send Message
```json
{
  "content": "I need help designing a microservices architecture for an e-commerce platform."
}
```

## Response Examples

### Session Created
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastAccessed": "2024-01-01T00:00:00.000Z",
  "currentPhase": 1,
  "customInstructions": "Create a modern web application...",
  "conversationHistory": []
}
```

### Message Response
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": {
    "id": "msg-123",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "role": "assistant",
    "content": "I'll help you design a microservices architecture..."
  },
  "conversationHistory": [...]
}
```

## Testing Features

The collection includes automatic testing scripts that:

- Validate response status codes
- Check response times (< 5 seconds)
- Verify required headers are present
- Add correlation IDs for request tracking

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure your backend server is running
   - Check the `baseUrl` variable matches your server port

2. **404 Not Found**
   - Verify the endpoint URL is correct
   - Check if the session ID exists

3. **500 Internal Server Error**
   - Check backend logs for detailed error messages
   - Verify environment variables are set correctly

4. **Rate Limiting**
   - The API has rate limiting (100 requests per 15 minutes)
   - Wait before making additional requests

### Environment Setup

For different environments, update the `baseUrl` variable:

- **Development**: `http://localhost:3001`
- **Staging**: `https://staging-api.yourdomain.com`
- **Production**: `https://api.yourdomain.com`

## Security Notes

- The API includes CORS protection
- Rate limiting is enabled
- Input sanitization is applied
- Correlation IDs are added for request tracking

## Support

For issues with the API or this collection:

1. Check the backend logs
2. Verify environment configuration
3. Test with the health check endpoints first
4. Review the API documentation in the backend code 