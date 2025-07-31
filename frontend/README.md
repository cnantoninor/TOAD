# TOAD Architect Frontend

A modern React-based frontend for the TOAD Architect software architecture assistant.

## Features

- **Real-time Chat Interface**: Interactive conversation with the AI assistant
- **Markdown Support**: Rich text rendering for AI responses
- **Session Management**: Create new sessions and manage conversation history
- **Export Functionality**: Download conversations as Markdown files
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, professional interface with Tailwind CSS

## Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Markdown** for rich text rendering
- **Lucide React** for icons
- **Axios** for API communication

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend server running on `http://localhost:3001`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:3001/api
```

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Project Structure

```
src/
├── components/          # React components
│   ├── Chat.tsx        # Main chat interface
│   └── Message.tsx     # Individual message component
├── contexts/           # React contexts
│   └── SessionContext.tsx  # Session state management
├── services/           # API services
│   └── api.ts         # Backend API communication
├── types/              # TypeScript type definitions
│   └── index.ts       # Shared types
├── App.tsx            # Main app component
├── index.tsx          # App entry point
└── index.css          # Global styles
```

## Usage

1. **Start a New Session**: Click "Start New Session" to begin
2. **Chat with AI**: Type your questions about software architecture
3. **Export Conversations**: Click "Export" to download as Markdown
4. **Session Management**: Create new sessions anytime

## Development

### Adding New Components

1. Create component in `src/components/`
2. Add TypeScript interfaces for props
3. Use Tailwind CSS for styling
4. Follow the existing component patterns

### API Integration

- All API calls go through `src/services/api.ts`
- Use the `useSession` hook for session management
- Handle errors gracefully with user-friendly messages

### Styling

- Use Tailwind CSS utility classes
- Custom components defined in `src/index.css`
- Follow the design system with primary colors and spacing

## Testing

Run tests with:
```bash
npm test
```

## Building for Production

```bash
npm run build
```

The build output will be in the `build/` directory.

## Contributing

1. Follow the existing code style
2. Add TypeScript types for all new features
3. Test your changes thoroughly
4. Update documentation as needed 