import React from 'react';
import { SessionProvider } from './contexts/SessionContext';
import { Chat } from './components/Chat';
import './index.css';

function App() {
    return (
        <SessionProvider>
            <div className="App">
                <Chat />
            </div>
        </SessionProvider>
    );
}

export default App; 