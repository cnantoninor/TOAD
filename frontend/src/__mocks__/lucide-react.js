import React from 'react';

// Mock all lucide-react icons
const createMockIcon = (name) => (props) => 
  React.createElement('svg', { 
    ...props, 
    'data-testid': `${name.toLowerCase()}-icon`,
    role: 'img',
    'aria-hidden': true
  });

export const Send = createMockIcon('Send');
export const Download = createMockIcon('Download');
export const Plus = createMockIcon('Plus');
export const Bot = createMockIcon('Bot');
export const User = createMockIcon('User');
export const ArrowRight = createMockIcon('ArrowRight');
export const Home = createMockIcon('Home');
export const Copy = createMockIcon('Copy');
export const Check = createMockIcon('Check');