import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './contexts/SessionContext';
import { Chat } from './components/Chat';
import { SessionCreation } from './components/SessionCreation';
import './index.css';

function App() {
    return (
        <Router>
            <SessionProvider>
                <div className="App">
                    <Routes>
                        <Route path="/" element={<SessionCreation />} />
                        <Route path="/session/:sessionId" element={<Chat />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </SessionProvider>
        </Router>
    );
}

export default App; 