import React from 'react';

const ReactMarkdown = ({ children, ...props }) => {
  return React.createElement('div', { ...props, 'data-testid': 'markdown' }, children);
};

export default ReactMarkdown;